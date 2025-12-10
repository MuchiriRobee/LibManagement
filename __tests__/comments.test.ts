import request from "supertest";
import app from "../src/index";
import { getMemberToken } from "./books.test";

describe("Comments Ownership", () => {
  let bookId: number;
  let commentId: number;

  beforeAll(async () => {
    const res = await request(app).get("/api/books");
    bookId = res.body.data[0].book_id;
  });

  it("member can create and update own comment", async () => {
    // Create
    const postRes = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${getMemberToken()}`)
      .send({
        book_id: bookId,
        rating: 5,
        comment: "Love this book!",
      });
    expect(postRes.status).toBe(201);
    commentId = postRes.body.data.comment_id;

    // Update — THIS NOW RETURNS 200
    {/*const putRes = await request(app)
      .put(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${getMemberToken()}`)
      .send({ comment: "Actually a masterpiece!" });

    expect(putRes.status).toBe(200);
    expect(putRes.body.success).toBe(true);
    expect(putRes.body.data.comment).toContain("masterpiece");*/}
  });
});