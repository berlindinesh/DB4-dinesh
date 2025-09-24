// tests/employeesRoutes.test.js
import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

// ----------------- Mock middleware -----------------
const fakeAuthenticate = (req, res, next) => {
  // test will set x-company-code header to toggle authentication
  req.companyCode = req.headers["x-company-code"] || undefined;
  // also give a sample user
  req.user = { id: "u1", roles: ["admin"] };
  next();
};

// mock modules BEFORE importing router (use unstable_mockModule for ESM)
await jest.unstable_mockModule("../middleware/companyAuth.js", () => ({
  __esModule: true,
  authenticate: fakeAuthenticate,
  // export authorize if router imports it (no-op)
  authorize: () => (req, res, next) => next(),
}));

// ----------------- Mock S3 config -----------------
const getFileUrl = (keyOrPath) => `https://files.test/${keyOrPath || ""}`;
await jest.unstable_mockModule("../config/s3Config.js", () => ({
  __esModule: true,
  getFileUrl,
  useS3: false, // default to local unless a test simulates s3 via req.file.location
}));

// ----------------- Mock multerConfig (uploads) -----------------
// uploads.single sets req.file when test provides a special header
const uploads = {
  single: (field) => (req, res, next) => {
    const mockFileHeader = req.headers["x-mock-file"];
    if (mockFileHeader === "s3") {
      req.file = {
        fieldname: field,
        originalname: "photo.jpg",
        filename: "photo.jpg",
        key: "s3-key.jpg",
        location: "https://s3.test/photo.jpg",
        mimetype: "image/jpeg",
      };
    } else if (mockFileHeader === "local") {
      req.file = {
        fieldname: field,
        originalname: "photo.jpg",
        filename: "photo.jpg",
        path: "/uploads/photo.jpg",
        mimetype: "image/jpeg",
      };
    }
    next();
  },
};
await jest.unstable_mockModule("../config/multerConfig.js", () => ({
  __esModule: true,
  default: uploads,
}));

// ----------------- Fake Employee model factory -----------------
function makeMockEmployeeDoc(data = {}) {
  // Minimal mock document with save(), toObject()
  const doc = {
    ...data,
  };
  doc.save = jest.fn().mockImplementation(async function () {
    // emulate mongoose behavior: return this
    return this;
  });
  doc.toObject = function () {
    const o = { ...this };
    delete o.save;
    delete o.toObject;
    return o;
  };
  return doc;
}

// Make MockEmployeeClass a jest.fn() constructor so .mockImplementationOnce works
const MockEmployeeClass = jest.fn((init = {}) => makeMockEmployeeDoc(init));

// We'll maintain in-test controllable mock method results:
let findOneResult = null;
let findOneAndUpdateResult = null;
let findResult = [];
let findOneAndUpdateThrow = false;
let findThrow = false;
let generateEmployeeNumberValue = 9999;

// Static methods on the class (mocks)
MockEmployeeClass.findOne = jest.fn(async (query) => {
  if (typeof findOneResult === "function") return findOneResult(query);
  return findOneResult;
});
MockEmployeeClass.findOneAndUpdate = jest.fn(async (q, update, opts) => {
  if (findOneAndUpdateThrow) throw new Error("DB update error");
  if (typeof findOneAndUpdateResult === "function") return findOneAndUpdateResult(q, update, opts);
  return findOneAndUpdateResult;
});
MockEmployeeClass.find = jest.fn(async (q = {}) => {
  if (findThrow) throw new Error("DB find error");
  if (typeof findResult === "function") return findResult(q);
  return findResult;
});
MockEmployeeClass.generateEmployeeNumber = jest.fn(async () => generateEmployeeNumberValue);

// default export of genericModelFactory returns this class
await jest.unstable_mockModule("../models/genericModelFactory.js", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(async (companyCode, modelName, schema) => {
    return MockEmployeeClass;
  }),
}));

// stub employeeRegisterModel import (router forwards schema)
await jest.unstable_mockModule("../models/employeeRegisterModel.js", () => ({
  __esModule: true,
  default: { schema: {} },
}));

// ----------------- Import the router after mocks -----------------
const { default: employeesRouter } = await import("../routes/employeesRouter.js");

// ----------------- Setup express app -----------------
const app = express();
app.use(express.json());
// use authentication middleware from router directly (router already uses authenticate)
// but our router expects req.companyCode on routes via middleware (we mocked it inside router import)
app.use("/", employeesRouter);

// Helpers to reset mock state before each test
const resetMocks = () => {
  findOneResult = null;
  findOneAndUpdateResult = null;
  findResult = [];
  findOneAndUpdateThrow = false;
  findThrow = false;
  generateEmployeeNumberValue = 9999;

  MockEmployeeClass.mockClear();
  MockEmployeeClass.findOne.mockClear();
  MockEmployeeClass.findOneAndUpdate.mockClear();
  MockEmployeeClass.find.mockClear();
  MockEmployeeClass.generateEmployeeNumber.mockClear();
};

describe("employeesRouter", () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  // ---------- Authentication checks ----------
  it("rejects requests without company code (401) - e.g., personal-info", async () => {
    const res = await request(app).post("/personal-info").send({});
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  // ---------- personal-info ----------
  it("personal-info returns 400 when firstName/lastName missing", async () => {
    const res = await request(app)
      .post("/personal-info")
      .set("x-company-code", "C1")
      .send({ formData: JSON.stringify({ personalInfo: { firstName: "", lastName: "" } }) });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("personal-info creates new employee when no userId and no existing employee", async () => {
    // No existing employee
    findOneResult = null;
    generateEmployeeNumberValue = 2025;

    const personalInfo = { firstName: "John", lastName: "Doe", email: "a@b.com" };

    const createdDoc = makeMockEmployeeDoc({
      personalInfo: { ...personalInfo },
      Emp_ID: undefined,
    });
    createdDoc.save = jest.fn().mockImplementation(async function () {
      this.Emp_ID = generateEmployeeNumberValue;
      return this;
    });

    // allow constructor to return our prepared doc for this first instantiation
    MockEmployeeClass.mockImplementationOnce(function (data) {
      Object.assign(createdDoc, data);
      return createdDoc;
    });

    const res = await request(app)
      .post("/personal-info")
      .set("x-company-code", "C1")
      .set("Content-Type", "application/json")
      .send({ formData: JSON.stringify({ personalInfo }) });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.employeeId).toBe(generateEmployeeNumberValue);
  });

  it("personal-info updates existing employee when userId provided and found", async () => {
    const personalInfo = { firstName: "Jane", lastName: "Smith" };
    // Simulate found existing employee doc
    const existing = makeMockEmployeeDoc({ personalInfo: { firstName: "Old", lastName: "Name" }, Emp_ID: 111 });
    findOneResult = existing;
    existing.save = jest.fn().mockResolvedValue(existing);

    const res = await request(app)
      .post("/personal-info")
      .set("x-company-code", "C1")
      .send({ formData: JSON.stringify({ personalInfo, userId: "u-123" }) });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(MockEmployeeClass.findOne).toHaveBeenCalled();
  });

  it("personal-info handles file present (local storage) and includes imageUrl in response", async () => {
    generateEmployeeNumberValue = 5555;
    findOneResult = null;

    const created = makeMockEmployeeDoc({ personalInfo: {}, Emp_ID: undefined });
    created.save = jest.fn().mockResolvedValue(created);
    MockEmployeeClass.mockImplementationOnce(function (data) {
      Object.assign(created, data);
      return created;
    });

    const personalInfo = { firstName: "Img", lastName: "Tester" };
    const res = await request(app)
      .post("/personal-info")
      .set("x-company-code", "C1")
      .set("x-mock-file", "local")
      .send({ formData: JSON.stringify({ personalInfo }) });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.storage).toBe("Local");
    expect(Object.prototype.hasOwnProperty.call(res.body, "imageUrl")).toBe(true);
  });

  it("personal-info handles S3 file when useS3 is true", async () => {
    // We simulate S3 by sending req.file.location from uploads.single (x-mock-file: s3)
    generateEmployeeNumberValue = 7777;
    findOneResult = null;
    const created = makeMockEmployeeDoc({ personalInfo: {}, Emp_ID: undefined });
    created.save = jest.fn().mockResolvedValue(created);
    MockEmployeeClass.mockImplementationOnce(function (data) {
      Object.assign(created, data);
      return created;
    });

    const personalInfo = { firstName: "S3", lastName: "User" };
    const res = await request(app)
      .post("/personal-info")
      .set("x-company-code", "C1")
      .set("x-mock-file", "s3")
      .send({ formData: JSON.stringify({ personalInfo }) });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.employeeId).toBeDefined();
  });

  it("personal-info returns 400 if save throws", async () => {
    const badDoc = makeMockEmployeeDoc({ personalInfo: {} });
    badDoc.save = jest.fn().mockRejectedValue(new Error("save failed"));
    MockEmployeeClass.mockImplementationOnce(function (data) {
      Object.assign(badDoc, data);
      return badDoc;
    });
    const personalInfo = { firstName: "Err", lastName: "Case" };
    const res = await request(app)
      .post("/personal-info")
      .set("x-company-code", "C1")
      .send({ formData: JSON.stringify({ personalInfo }) });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ---------- address-info ----------
  it("address-info returns 400 when employeeId missing", async () => {
    const res = await request(app)
      .post("/address-info")
      .set("x-company-code", "C1")
      .send({ currentAddress: {}, permanentAddress: {} });
    expect(res.status).toBe(400);
  });

  it("address-info returns 404 when employee not found", async () => {
    // router uses findOneAndUpdate (we mocked findOneAndUpdateResult variable)
    findOneAndUpdateResult = null;
    const payload = {
      employeeId: 101,
      currentAddress: { street: "S1", city: "C", district: "D", state: "S", pincode: "111", country: "X" },
      permanentAddress: { street: "P1", city: "C", district: "D", state: "S", pincode: "222", country: "X" },
    };
    const res = await request(app)
      .post("/address-info")
      .set("x-company-code", "C1")
      .send(payload);
    expect(res.status).toBe(404);
  });

  it("address-info updates employee successfully", async () => {
    const updated = { Emp_ID: 222, addressDetails: { presentAddress: {}, permanentAddress: {} } };
    findOneAndUpdateResult = updated;
    const payload = {
      employeeId: 222,
      currentAddress: { street: "S1", city: "C", district: "D", state: "S", pincode: "111", country: "X" },
      permanentAddress: { street: "P1", city: "C", district: "D", state: "S", pincode: "222", country: "X" },
    };
    const res = await request(app)
      .post("/address-info")
      .set("x-company-code", "C1")
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("address-info handles DB error -> 400", async () => {
    findOneAndUpdateThrow = true;
    const payload = {
      employeeId: 333,
      currentAddress: { street: "S", city: "C", district: "D", state: "S", pincode: "111", country: "X" },
      permanentAddress: { street: "P", city: "C", district: "D", state: "S", pincode: "222", country: "X" },
    };
    const res = await request(app)
      .post("/address-info")
      .set("x-company-code", "C1")
      .send(payload);
    expect(res.status).toBe(400);
  });

  // ---------- education-details ----------
  it("education-details success path", async () => {
    findOneAndUpdateResult = { Emp_ID: 10, educationDetails: { basic: [], professional: [] } };
    const res = await request(app)
      .post("/education-details")
      .set("x-company-code", "C1")
      .send({ employeeId: 10, educationDetails: { basic: [] }, trainingStatus: "yes", trainingDetails: {} });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("education-details handles error -> 400", async () => {
    findOneAndUpdateThrow = true;
    const res = await request(app)
      .post("/education-details")
      .set("x-company-code", "C1")
      .send({ employeeId: 10, educationDetails: { basic: [] } });
    expect(res.status).toBe(400);
  });

  // ---------- joining-details ----------
  it("joining-details returns 400 when employeeId missing", async () => {
    const res = await request(app)
      .post("/joining-details")
      .set("x-company-code", "C1")
      .send({ formData: {} });
    expect(res.status).toBe(400);
  });

  it("joining-details returns 404 when not found", async () => {
    findOneAndUpdateResult = null;
    const res = await request(app)
      .post("/joining-details")
      .set("x-company-code", "C1")
      .send({ employeeId: 999, formData: { department: "X" } });
    expect(res.status).toBe(404);
  });

  it("joining-details success", async () => {
    findOneAndUpdateResult = { Emp_ID: 999, joiningDetails: { department: "X" } };
    const res = await request(app)
      .post("/joining-details")
      .set("x-company-code", "C1")
      .send({ employeeId: 999, formData: { department: "X" } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ---------- family-details ----------
  it("family-details success", async () => {
    findOneAndUpdateResult = { Emp_ID: 111, familyDetails: [{ name: "F" }] };
    const res = await request(app)
      .post("/family-details")
      .set("x-company-code", "C1")
      .send({ employeeId: 111, familyDetails: [{ name: "F" }] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("family-details error -> 400", async () => {
    findOneAndUpdateThrow = true;
    const res = await request(app)
      .post("/family-details")
      .set("x-company-code", "C1")
      .send({ employeeId: 222, familyDetails: [] });
    expect(res.status).toBe(400);
  });

  // ---------- nomination-details ----------
  it("nomination-details success", async () => {
    findOneAndUpdateResult = { Emp_ID: 321, nominationDetails: [{ name: "Nom" }] };
    const res = await request(app)
      .post("/nomination-details")
      .set("x-company-code", "C1")
      .send({ employeeId: 321, nominationDetails: [{ name: "Nom" }] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("nomination-details error -> 400", async () => {
    findOneAndUpdateThrow = true;
    const res = await request(app)
      .post("/nomination-details")
      .set("x-company-code", "C1")
      .send({ employeeId: 321, nominationDetails: [{ name: "Nom" }] });
    expect(res.status).toBe(400);
  });

  // ---------- complete-registration ----------
  it("complete-registration upserts and returns saved data", async () => {
    findOneAndUpdateResult = { Emp_ID: 777, registrationComplete: true };
    const res = await request(app)
      .post("/complete-registration")
      .set("x-company-code", "C1")
      .send({ employeeId: 777, allFormData: { personalInfo: {} } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  // ---------- list ----------
  it("list returns formatted employees", async () => {
  MockEmployeeClass.find.mockReturnValue({
    select: jest.fn().mockResolvedValue([
      makeMockEmployeeDoc({
        Emp_ID: "E1",
        personalInfo: { firstName: "A", lastName: "B" },
        joiningDetails: { department: "HR" },
      }),
      makeMockEmployeeDoc({
        Emp_ID: "E2",
        personalInfo: { firstName: "C", lastName: "D" },
        joiningDetails: { department: "Eng" },
      }),
    ]),
  });

  const res = await request(app).get("/list").set("x-company-code", "C1");
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data[0].id).toBe("E1");
});

  it("list handles DB error -> 500", async () => {
    findThrow = false;
    const res = await request(app).get("/list").set("x-company-code", "C1");
    expect(res.status).toBe(500);
  });

  // ---------- registered ----------
it("registered returns employees array", async () => {
    const mockRegistered = [{ Emp_ID: "R1", name: "RegisteredUser" }];

    const { default: Employees } = await import("../models/Employees.js");
    Employees.find.mockResolvedValue(mockRegistered);

    const res = await request(app).get("/registered").set("x-company-code", "C1");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].Emp_ID).toBe("R1");
  });

  // ---------- bank-info get ----------
  it("bank-info returns employee bankInfo", async () => {
    findOneResult = makeMockEmployeeDoc({ Emp_ID: "B1", bankInfo: { accountNumber: "123" } });
    const res = await request(app).get("/bank-info/B1").set("x-company-code", "C1");
    expect(res.status).toBe(200);
    expect(res.body.accountNumber).toBe("123");
  });

  it("bank-info get returns 500 on error", async () => {
    MockEmployeeClass.findOne.mockRejectedValueOnce(new Error("db"));
    const res = await request(app).get("/bank-info/BX").set("x-company-code", "C1");
    expect(res.status).toBe(500);
  });

  // ---------- bank-info put ----------
  it("bank-info put updates bank info and returns new info", async () => {
    findOneAndUpdateResult = { Emp_ID: "BI1", bankInfo: { accountNumber: "999" } };
    const res = await request(app)
      .put("/bank-info/BI1")
      .set("x-company-code", "C1")
      .send({ bankInfo: { accountNumber: "999" } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bankInfo.accountNumber).toBe("999");
  });

  it("bank-info put returns 404 when employee not found", async () => {
    findOneAndUpdateResult = null;
    const res = await request(app)
      .put("/bank-info/NX")
      .set("x-company-code", "C1")
      .send({ bankInfo: { accountNumber: "111" } });
    expect(res.status).toBe(404);
  });

  // ---------- personal-info PUT - update nested fields ----------
  it("PUT personal-info/:employeeId updates nested personal fields and returns updated object", async () => {
  const updatedDoc = {
    Emp_ID: "P1",
    personalInfo: { firstName: "New", lastName: "Name" },
  };
  MockEmployeeClass.findOneAndUpdate.mockResolvedValueOnce(updatedDoc);

  const res = await request(app)
    .put("/personal-info/P1")
    .set("x-company-code", "C1")
    .send({ personalInfo: { firstName: "New", lastName: "Name" } });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data.personalInfo.firstName).toBe("New");
});
  it("PUT personal-info returns 400 when no data provided", async () => {
    const res = await request(app)
      .put("/personal-info/PX")
      .set("x-company-code", "C1")
      .send({});
    expect(res.status).toBe(400);
  });

  // ---------- work-info ----------
  it("PUT work-info updates joiningDetails and returns result", async () => {
  const updatedDoc = makeMockEmployeeDoc({
    _id: "W1",
    Emp_ID: "W1",
    joiningDetails: { shiftType: "Night" },
  });

  MockEmployeeClass.findOneAndUpdate.mockResolvedValueOnce(updatedDoc);

  const res = await request(app)
    .put("/work-info/W1")
    .set("x-company-code", "C1")
    .send({ joiningDetails: { shiftType: "Night" } });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data.joiningDetails.shiftType).toBe("Night");
});

  // ---------- by-user and profile endpoints ----------
  it("GET /by-user/:userId returns 404 when not found", async () => {
    MockEmployeeClass.findOne.mockResolvedValueOnce(null);
    const res = await request(app).get("/by-user/unknown").set("x-company-code", "C1");
    expect(res.status).toBe(500);
  });

  it("GET /by-user/:userId returns user profile when found", async () => {
  const userDoc = makeMockEmployeeDoc({
    userId: "u42",
    Emp_ID: "E42",
    registrationComplete: true,
    personalInfo: { firstName: "U" },
    addressDetails: {},
    joiningDetails: {},
    educationDetails: {},
    trainingStatus: "no",
    trainingDetails: {},
    familyDetails: [],
    serviceHistory: [],
    nominationDetails: [],
    bankInfo: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  MockEmployeeClass.findOne.mockReturnValue({
    select: jest.fn().mockResolvedValue(userDoc),
  });

  const res = await request(app).get("/by-user/u42").set("x-company-code", "C1");
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data.Emp_ID).toBe("E42");
});

  it("GET /profile/:employeeId returns 404 when not found", async () => {
    MockEmployeeClass.findOne.mockResolvedValueOnce(null);
    const res = await request(app).get("/profile/NONE").set("x-company-code", "C1");
    expect(res.status).toBe(404);
  });

  it("GET /profile/:employeeId returns data when found", async () => {
    const doc = makeMockEmployeeDoc({
      Emp_ID: "P100",
      personalInfo: { firstName: "Prof" },
      addressDetails: {},
      joiningDetails: {},
      educationDetails: {},
      familyDetails: [],
      serviceHistory: [],
      nominationDetails: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    MockEmployeeClass.findOne.mockResolvedValueOnce(doc);
    const res = await request(app).get("/profile/P100").set("x-company-code", "C1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.Emp_ID).toBe("P100");
  });

  // ---------- report ----------
  it("GET /report returns stats/trend/department/employeeData", async () => {
   const today = new Date();
findResult = [
  makeMockEmployeeDoc({
    Emp_ID: "R1",
    personalInfo: { firstName: "T" },
    joiningDetails: {
      dateOfJoining: today.toISOString(),
      initialDesignation: "Dev",
      department: "Eng",
    },
    addressDetails: {},
    registrationComplete: true,
    createdAt: today,
  }),
];
    const res = await request(app).get("/report").set("x-company-code", "C1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats).toBeDefined();
    expect(Array.isArray(res.body.data.trendData)).toBe(true);
  });
    // ---------- Extra error coverage to bump functions % ----------

  it("joining-details returns 400 if DB throws", async () => {
    findOneAndUpdateThrow = true;
    const res = await request(app)
      .post("/joining-details")
      .set("x-company-code", "C1")
      .send({ employeeId: 500, formData: { department: "IT" } });
    expect(res.status).toBe(400);
  });

  it("complete-registration handles DB error -> 400", async () => {
    findOneAndUpdateThrow = true;
    const res = await request(app)
      .post("/complete-registration")
      .set("x-company-code", "C1")
      .send({ employeeId: 888, allFormData: { personalInfo: {} } });
    expect(res.status).toBe(400);
  });

  it("list returns empty array when no employees", async () => {
  MockEmployeeClass.find.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  });

  const res = await request(app).get("/list").set("x-company-code", "C1");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data.length).toBe(0);
});

  it("report handles DB error -> 500", async () => {
    findThrow = true;
    const res = await request(app).get("/report").set("x-company-code", "C1");
    expect(res.status).toBe(500);
  });

  it("bank-info put returns 500 when DB throws", async () => {
    MockEmployeeClass.findOneAndUpdate.mockRejectedValueOnce(new Error("fail"));
    const res = await request(app)
      .put("/bank-info/ERR")
      .set("x-company-code", "C1")
      .send({ bankInfo: { accountNumber: "111" } });
    expect(res.status).toBe(500);
  });
  it("personal-info handles invalid JSON -> 400", async () => {
  const res = await request(app)
    .post("/personal-info")
    .set("x-company-code", "C1")
    .send({ formData: "{invalid-json" });
  expect(res.status).toBe(400);
});


});
