import React from "react";
import { render, screen } from "@testing-library/react";

describe("App", () => {
  test("basic functionality test", () => {
    const TestComponent = () => <div>App Test Component</div>;
    render(<TestComponent />);
    expect(screen.getByText("App Test Component")).toBeInTheDocument();
  });
});
