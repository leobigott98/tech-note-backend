const Note = require('../models/Note')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res)=>{
    const { id } = req.params
    const user = await User.findById(id).exec()
    // Check if user exists
    if(!user){
        return res.status(401).json({ message: 'User not found' })
    }
    // Check if user is active
    if(!user.active){
        return res.status(403).json({ message: 'User not active'})
    }
    // Check is user has assigned roles
    if (!user.roles || !Array.isArray(user.roles) || !user.roles.length){
        return res.status(403).json({ message: 'Not a valid user'} )
    }
    // Check if user is manager or admin
    const isManagerOrAdmin = user.roles.find((role) => role === 'Manager' || role === 'Admin')
    if(isManagerOrAdmin){
        // Return all notes
        const notes = await Note.find().lean().exec()
        if(!notes?.length){
            return res.status(400).json({ message: 'No notes found'})
        }
        return res.json(notes)
    }
    // Check if user is employee
    const isEmployee = user.roles.find((role) => role === 'Employee')
    if(isEmployee){
        // Return Employee notes
        const notes = await Note.find({ user: user._id}).lean().exec()
        if(!notes?.length){
            return res.status(400).json({ message: 'No notes found'})
        }
        return res.json(notes)
    }
    // If user has no valid role
    if(!isManagerOrAdmin || !isEmployee){
        return res.status(403).json({ message: 'User does not have necessary permissions'})
    }
})

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async(req, res)=>{
    const { userId, title, text, completed } = req.body

    // Confirm data
    if(!userId || !title || !text || !completed){
        return res.status(400).json({ message: 'All fields are required'})
    }

    const noteObject = {user: userId, title, text, completed}

    // Create and store new note
    const note = await Note.create(noteObject)

    if(note){
        res.status(201).json({ message: 'New note created'})
    }else{
        res.status(400).json({ message: 'Invalid note data received'})
    }
})

// @desc Update note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async(req, res)=>{
    const { userId, ticket, title, text, completed } = req.body

    // Confirm data
    if(!userId || !ticket || !title || !text || !completed){
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check if user exists
    const user = await User.findById(userId).lean().exec()

    if(!user){
        return res.status(400).json({ message: 'User not found'})
    }

    // Check if user is authorized to update note
    if(!user.active){ //check if active
        return res.status(403).json({message: 'User not active'})
    }

    if(!Array.isArray(user.roles) || !user.roles.length){ //check if it has roles
        return res.status(403).json({ message: 'Not a valid User'})
    }

    const isManagerOrAdmin = user.roles.find((role) => role === 'Manager' || role === 'Admin' ) // check if manager or admin
    const isEmployee = user.roles.find((role) => role === 'Employee') // check if employee

    if(!isManagerOrAdmin || !isEmployee){
        return res.status(403).json({ message: 'User does not have necessary permissions'})
    }

    const note = await Note.findOne({ticket}).exec()

    const updateValues = ()=>{
        note.title = title
        note.text = text
        note.completed = completed
    }

    if(isManagerOrAdmin){
        updateValues
    }else if(isEmployee){
        if(note.user === user._id){
            updateValues
        } else{
            return res.status(403).json({ message: 'Not authorized'})
        }
    }

    const updatedNote = await note.save()

    if(!updatedNote){
        return res.status(400).json({ message: 'Invalid note data received'})
    }

    res.json({ message: `Updated ticket ${note.ticket}`})
})

// @desc Delete note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async(req, res)=>{
    const { userId, ticket } = req.body

    // Confirm data
    if(!userId || !ticket){
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm user
    const user = await User.findById(userId).lean().exec()

    if(!user.active){
        return res.status(403).json({message: 'User not active'})
    }
    
    if(!Array.isArray(user.roles) || !user.roles.length){
        return res.status(403).json({ message: 'User has no assigned roles'})
    }

    const isManagerOrAdmin = user.roles.find((role) => role === 'Manager' || role === 'Admin')

    if(!isManagerOrAdmin){
        return res.status(403).json({ message: 'Must be admin or manager'})
    }

    const note = await Note.findOne({ticket}).exec()

    if(!note){
        return res.status(400).json({ message: 'Note not found'})
    }

    const result = await note.deleteOne()

    res.json({ message: `Ticket ${ticket} was deleted`})
})

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}