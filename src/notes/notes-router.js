const express = require("express");
const NotesService = require("./notes-service");
const path = require("path");

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = (note) => ({
  id: note.id,
  name: note.name,
  modified: note.modified,
  folderId: note.folderId,
  content: note.content,
});

notesRouter
  .route("/")
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get("db"))
      .then((notes) => {
        res.json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name, modified, folderId, content } = req.body;
    const newNote = { name, folderId, content };

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
    }

    newNote.modified = modified;
    NotesService.insertNote(req.app.get("db"), newNote)
      .then((note) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(serializeNote(note));
      })
      .catch(next);
  });

notesRouter
  .route("/:noteId")
  .all((req, res, next) => {
    const { noteId } = req.params;
    NotesService.getById(req.app.get("db"), noteId)
      .then((note) => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note Not Found` },
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json({
      id: res.note.id,
      name: res.note.name,
      modified: res.note.modified,
      folderId: res.note.folderId,
      content: res.note.content,
    });
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, modified, folderId, content } = req.body;
    const noteToUpdate = { name, modified, folderId, content };

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;

    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain 'name','modified','folderId','content'`,
        },
      });
    }

    NotesService.updateNote(req.app.get("db"), req.params.noteId, noteToUpdate)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(req.app.get("db"), req.params.noteId)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });
module.exports = notesRouter;
