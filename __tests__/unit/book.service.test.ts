import { createBook } from "../../src/services/books.Service";

jest.mock("../../src/repositories/books.Repository", () => ({
  categoryExists: jest.fn(),
  create: jest.fn(),
}));

const { categoryExists, create } = require("../../src/repositories/books.Repository");

describe("Books Service – Stock Rules", () => {
  it("should reject negative stock", async () => {
    await expect(
      createBook({ title: "X", author: "Y", stock_quantity: -5 })
    ).rejects.toThrow("Stock quantity must be non-negative");
  });

  it("should reject invalid publication year", async () => {
    const future = new Date().getFullYear() + 10;
    await expect(
      createBook({ title: "Future", author: "AI", publication_year: future, stock_quantity: 10 })
    ).rejects.toThrow("Invalid publication year");
  });

  it("should allow null category_id", async () => {
    (categoryExists as jest.Mock).mockResolvedValue(true);
    (create as jest.Mock).mockResolvedValue({ book_id: 99 });

    const result = await createBook({
      title: "Valid",
      author: "Me",
      category_id: null,
      stock_quantity: 10,
    });

    expect(create).toHaveBeenCalledWith(
      "Valid",
      "Me",
      null,
      undefined,
      10
    );
  });
});