// const { expect } = require('chai')
const knex = require("knex");
const app = require("../src/app");
const { makeFolderArray } = require("./folderfixtures");

describe("Noteful Endpoints", function () {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () => db.raw("TRUNCATE folders, notes"));

  afterEach("cleanup", () => db.raw("TRUNCATE folders, notes"));

  describe("Get /api/folders Endpoint", function () {
    context("Given database is empty", () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/folders").expect(200, []);
      });
    });
    context("Given there are folders in the database", () => {
      const testFolders = makeFolderArray();

      beforeEach("insert folders", () => {
        return db
          .into("notes")
          .insert(testFolders)
          .then(() => {
            return db.into("folders").insert(testFolders);
          });
      });

      it("gets the folders from the store", () => {
        return supertest(app).get("/api/folders").expect(200, testFolders);
      });
    });
  });
});
