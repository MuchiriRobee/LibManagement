import request from "supertest";
import app from "../src/index";

let token: string;
let adminToken: string;
let bookId: number;

beforeAll(async () => {
  // Create member
  await request(app).post("/api/users/register").send({
    username: "member",
    email: "member@test.com",
    password: "pass123",
  });
  const memberLogin = await request(app).post("/api/users/login").send({
    email: "member@test.com",
    password: "pass123",
  });
  token = memberLogin.body.data.token;

  // Create admin
  await request(app).post("/api/users/register").send({
    username: "admin",
    email: "admin@test.com",
    password: "admin123",
    role: "Admin",
  });
  const adminLogin = await request(app).post("/api/users/login").send({
    email: "admin@test.com",
    password: "admin123",
  });
  adminToken = adminLogin.body.data.token;
});

describe("Books CRUD + Stock Protection", () => {
  it("should create a book", async () => {
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Stock Test",
        author: "Jest",
        stock_quantity: 3,
      });
    expect(res.status).toBe(201);
    bookId = res.body.data.book_id;
  });

  it("should prevent borrow if stock = 0", async () => {
    // Borrow 3 times
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/borrow")
        .set("Authorization", `Bearer ${token}`)
        .send({ book_id: bookId });
    }

    // 4th attempt → should be 400
    const res = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${token}`)
      .send({ book_id: bookId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("not available");
  });
});
export const getAdminToken = () => adminToken;
export const getMemberToken = () => token;
export { bookId };