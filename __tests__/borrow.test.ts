import request from "supertest";
import app from "../src/index";
import { getMemberToken, getAdminToken } from "./books.test";

describe("Borrow & Return Lifecycle", () => {
  let bookId: number;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/books")
      .set("Authorization", `Bearer ${getAdminToken()}`)
      .send({
        title: "Borrow Lifecycle Book",
        author: "Robert C. Martin",
        stock_quantity: 1,
      });
    expect(res.status).toBe(201);
    bookId = res.body.data.book_id;
  }, 20000);

  it("borrow → return → stock restored", async () => {
    // Borrow
    const borrowRes = await request(app)
      .post("/api/borrow")
      .set("Authorization", `Bearer ${getMemberToken()}`)
      .send({ book_id: bookId });
    expect(borrowRes.status).toBe(201);

    // Get my active borrow
    const myRes = await request(app)
      .get("/api/borrow/my")
      .set("Authorization", `Bearer ${getMemberToken()}`);
    const borrowId = myRes.body.data[0].borrow_id;

    // Return
    const returnRes = await request(app)
      .patch(`/api/borrow/return/${borrowId}`)
      .set("Authorization", `Bearer ${getMemberToken()}`);
    expect(returnRes.status).toBe(200);

    // Stock should be back to 1
    const bookRes = await request(app).get(`/api/books/${bookId}`);
    expect(bookRes.body.data.stock_quantity).toBe(1);
  });
});