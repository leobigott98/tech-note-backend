const express = require('express')
const router = express.Router()
const notesController = require('../controllers/notesController')

router.route('/')
    .post(notesController.createNewNote)
    .patch(notesController.updateNote)
    .delete(notesController.deleteNote)

router.route('/:id') // THIS WILL BE FIXED WITH JWT LATER!
    .get(notesController.getAllNotes)

module.exports = router