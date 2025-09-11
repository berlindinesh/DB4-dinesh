import { jest } from "@jest/globals";
import { getAttendanceStats, getAttendanceTrends, getWorkTypeDistribution, getDepartmentSummary } from '../controllers/dashboardController.js';
import Attendance from '../models/attendanceModel.js';

// Mock the entire Attendance model and its methods
jest.mock('../models/attendanceModel.js', () => ({
  find: jest.fn(),
  distinct: jest.fn(),
  sort: jest.fn(() => ({
    limit: jest.fn(() => ({
      select: jest.fn()
    }))
  })),
}));

describe('dashboardController', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    };
    mockRequest = {};
  });

  // --- getAttendanceStats Tests ---
  describe('getAttendanceStats', () => {
    it('should return correct attendance statistics for a day with diverse records', async () => {
      // Mock data for the "happy path"
      Attendance.distinct.mockResolvedValue(['emp1', 'emp2', 'emp3', 'emp4']);
      Attendance.find.mockResolvedValueOnce([
        { empId: 'emp1', checkIn: '09:00', checkOut: '17:30', comment: 'On Time' },
        { empId: 'emp2', checkIn: '09:45', checkOut: '17:00', comment: 'Late' },
        { empId: 'emp3', checkIn: '-', comment: 'Leave' },
        { empId: 'emp4', checkIn: '-', comment: 'Absent' },
      ]).mockResolvedValueOnce([
        { atWork: '8.5' },
        { atWork: '7.25' },
        { atWork: '9' },
        { atWork: 'some-text' }
      ]).mockResolvedValueOnce([
        { _id: 'rec1', name: 'John Doe', empId: 'emp1', date: new Date(), checkIn: '09:00', checkOut: '17:30', comment: 'On Time' },
        { _id: 'rec2', name: 'Jane Smith', empId: 'emp2', date: new Date(), checkIn: '09:45', checkOut: '17:00', comment: 'Late' },
        { _id: 'rec3', name: 'Peter Jones', empId: 'emp3', date: new Date(), checkIn: '-', checkOut: '-', comment: 'On Leave' },
        { _id: 'rec4', name: 'Sarah Lee', empId: 'emp4', date: new Date(), checkIn: '10:00', checkOut: '18:00', comment: 'Late' },
        { _id: 'rec5', name: 'Mike Ross', empId: 'emp5', date: new Date(), checkIn: '-', checkOut: '-', comment: 'Absent' },
      ]);

      await getAttendanceStats(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        totalEmployees: 4,
        presentToday: 2,
        lateToday: 1,
        onLeave: 1,
        attendanceRate: 50,
        averageWorkHours: '8.2',
        recentAttendance: expect.arrayContaining([
          expect.objectContaining({ status: 'Present', time: '09:00' }),
          expect.objectContaining({ status: 'Late', time: '09:45' }),
          expect.objectContaining({ status: 'On Leave', time: '-' }),
          expect.objectContaining({ status: 'Late', time: '10:00' }),
          expect.objectContaining({ status: 'Absent', time: '-' }),
        ]),
      });
    });

    it('should handle zero employees and no attendance records gracefully', async () => {
      Attendance.distinct.mockResolvedValue([]);
      Attendance.find.mockResolvedValue([]);

      await getAttendanceStats(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        totalEmployees: 0,
        presentToday: 0,
        lateToday: 0,
        onLeave: 0,
        attendanceRate: 0,
        averageWorkHours: 0,
        recentAttendance: [],
      });
    });

    it('should return 500 status on database error', async () => {
      const errorMessage = 'Test database error';
      Attendance.distinct.mockRejectedValue(new Error(errorMessage));

      await getAttendanceStats(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching attendance statistics',
        error: errorMessage,
      });
    });
  });

  // --- getAttendanceTrends Tests ---
  describe('getAttendanceTrends', () => {
    it('should return attendance trends for the past 7 days', async () => {
      Attendance.find.mockResolvedValueOnce([{ checkIn: '09:00' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ checkIn: '09:00' }, { checkIn: '-' }])
        .mockResolvedValueOnce([{ checkIn: '09:00' }])
        .mockResolvedValueOnce([{ checkIn: '09:00' }, { checkIn: '-' }])
        .mockResolvedValueOnce([{ checkIn: '09:00' }])
        .mockResolvedValueOnce([{ checkIn: '09:00' }, { checkIn: '-' }]);

      await getAttendanceTrends(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveLength(7);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ present: 1, absent: 0 }),
        expect.objectContaining({ present: 0, absent: 0 }),
        expect.objectContaining({ present: 1, absent: 1 }),
      ]));
    }); 

    it('should return 500 status on database error', async () => {
      const errorMessage = 'Trends database error';
      Attendance.find.mockRejectedValue(new Error(errorMessage));

      await getAttendanceTrends(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching attendance trends',
        error: errorMessage,
      });
    });
  });

  // --- getWorkTypeDistribution Tests ---
  describe('getWorkTypeDistribution', () => {
    it('should return the correct count for each work type, including "Other"', async () => {
      const mockRecords = [
        { workType: 'Regular' },
        { workType: 'Regular' },
        { workType: 'Remote' },
        { workType: 'Hybrid' },
        { workType: '-' },
        { workType: 'Office' },
        { workType: 'Remote' },
        { workType: 'Regular' }
      ];
      Attendance.find.mockResolvedValue(mockRecords);

      await getWorkTypeDistribution(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        Regular: 3,
        Remote: 2,
        Hybrid: 1,
        Other: 2,
      });
    });

    it('should return 500 status on database error', async () => {
      const errorMessage = 'Work type database error';
      Attendance.find.mockRejectedValue(new Error(errorMessage));

      await getWorkTypeDistribution(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching work type distribution',
        error: errorMessage,
      });
    });
  });

  // --- getDepartmentSummary Tests ---
  describe('getDepartmentSummary', () => {
    it('should return the hardcoded department summary data', async () => {
      await getDepartmentSummary(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([
        { department: 'Engineering', presentPercentage: 92, employeeCount: 25 },
        { department: 'Marketing', presentPercentage: 88, employeeCount: 12 },
        { department: 'HR', presentPercentage: 95, employeeCount: 8 },
        { department: 'Finance', presentPercentage: 90, employeeCount: 10 }
      ]);
    });

    it('should return 500 status on a generic error', async () => {
      mockResponse.status.mockImplementationOnce(() => {
        throw new Error('Test generic error');
      });

      await getDepartmentSummary(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error fetching department summary',
        error: 'Test generic error',
      }));
    });
  });
});
