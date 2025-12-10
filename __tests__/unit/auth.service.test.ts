import { registerUser, loginUser } from "../../src/services/users.Service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../../src/repositories/user.Repository", () => ({
  findByEmail: jest.fn(),
  createUser: jest.fn(),
}));

const { findByEmail, createUser } = require("../../src/repositories/user.Repository");

describe("Auth Service – Pure Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register user with hashed password", async () => {
    (findByEmail as jest.Mock).mockResolvedValue(null);
    (createUser as jest.Mock).mockResolvedValue({
      user_id: 1,
      username: "john",
      email: "john@test.com",
      role: "Member",
    });

    const result = await registerUser({
      username: "john",
      email: "john@test.com",
      password: "plainpass",
      role: "Member",
    });

    expect(findByEmail).toHaveBeenCalledWith("john@test.com");
    expect(createUser).toHaveBeenCalled();
    const savedUser = (createUser as jest.Mock).mock.calls[0][0];
    expect(await bcrypt.compare("plainpass", savedUser.password)).toBe(true);
    expect(result.success).toBe(true);
    expect((result.data as any).password_hash).toBeUndefined(); // never leaked
  });

it("should login and return valid JWT", async () => {
  const hashed = await bcrypt.hash("password123", 12);

  (findByEmail as jest.Mock).mockResolvedValue({
    user_id: 5,
    email: "test@test.com",
    password_hash: hashed,
    role: "Admin",
  });

  const signSpy = jest
    .spyOn(jwt, "sign")
    .mockImplementation(() => "fake.jwt.token");

  const result = await loginUser({
    email: "test@test.com",
    password: "password123",
  });

  expect(result.success).toBe(true);
  expect(result.data.token).toBe("fake.jwt.token");
  expect(signSpy).toHaveBeenCalledTimes(1);
  expect(signSpy).toHaveBeenCalledWith(
    expect.objectContaining({ id: 5, role: "Admin" }),
    expect.any(String),
    { expiresIn: "24h" }
  );

  signSpy.mockRestore(); // clean up
});

  it("should reject wrong password", async () => {
    {
    const hashed = await bcrypt.hash("right", 12);
    (findByEmail as jest.Mock).mockResolvedValue({ password_hash: hashed });

    await expect(
      loginUser({ email: "x@x.com", password: "wrong" })
    ).rejects.toThrow("Invalid email or password");
};
  });
});