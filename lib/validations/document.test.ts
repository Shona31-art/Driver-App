import { describe, expect, it } from "vitest";
import { validateUploadedFile, MAX_FILE_SIZE_BYTES } from "./document";

function makeFile(name: string, size: number, type: string): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateUploadedFile", () => {
  it("accepts a normal PDF", () => {
    const file = makeFile("doc.pdf", 1024, "application/pdf");
    expect(validateUploadedFile(file)).toBeNull();
  });

  it("rejects an empty file", () => {
    const file = makeFile("empty.pdf", 0, "application/pdf");
    expect(validateUploadedFile(file)).not.toBeNull();
  });

  it("rejects a file over 20MB", () => {
    const file = makeFile("huge.pdf", MAX_FILE_SIZE_BYTES + 1, "application/pdf");
    expect(validateUploadedFile(file)).not.toBeNull();
  });

  it("rejects a disallowed mime type", () => {
    const file = makeFile("doc.docx", 1024, "application/msword");
    expect(validateUploadedFile(file)).not.toBeNull();
  });

  it("accepts PNG and JPEG", () => {
    expect(validateUploadedFile(makeFile("photo.png", 1024, "image/png"))).toBeNull();
    expect(validateUploadedFile(makeFile("photo.jpg", 1024, "image/jpeg"))).toBeNull();
  });
});
