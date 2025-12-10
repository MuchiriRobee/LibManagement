import { updateComment } from "../../src/services/comments.Service";

jest.mock("../../src/repositories/comment.Repository", () => ({
  findById: jest.fn(),
  update: jest.fn(),
}));

const repo = require("../../src/repositories/comment.Repository");

describe("Comments Service – Ownership", () => {
  it("should allow owner to update", async () => {
    repo.findById.mockResolvedValue({ comment_id: 1, user_id: 10 });
    repo.update.mockResolvedValue({ comment_id: 1, comment: "new text" });

    const result = await updateComment(1, 10, "Member", { comment: "new" });

    expect(result?.comment).toBe("new text");
  });

  it("should block non-owner", async () => {
    repo.findById.mockResolvedValue({ comment_id: 1, user_id: 999 });

    const result = await updateComment(1, 10, "Member", { comment: "hacked" });

    expect(result).toBeNull(); // not found / unauthorized
  });

  it("should allow admin to update any comment", async () => {
    repo.findById.mockResolvedValue({ comment_id: 1, user_id: 999 });
    repo.update.mockResolvedValue({ comment_id: 1 });

    const result = await updateComment(1, 888, "Admin", { comment: "moderated" });

    expect(result).not.toBeNull();
  });
});