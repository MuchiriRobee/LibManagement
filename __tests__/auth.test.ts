import request from "supertest";
import app from "../src/index"; 

let token: string;
let adminToken: string;

describe("Auth Flow", () => {
  it("should register a new member", async () => {
    const res = await request(app).post("/api/users/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("should login member and return token", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "testuser@example.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it("should reject invalid login", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "testuser@example.com",
      password: "wrong",
    });
    expect(res.status).toBe(401);
  });
});