const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler') //prevents from using try-catch blocks
const mongoose=require('mongoose')

//@desc Get all notes
//@route GET /notes
//@access Private
const getAllNotes=asyncHandler(async(req,res)=>{
    const notes = await Note.find().lean()

    if (!notes?.length){
        return res.status(400).json({message:'No Notes Found'})
    }

    // Add username to each note before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { 
            ...note, 
            username: user ? user.username : "Unknown User" // Handle missing user
        }
    }))

    res.json(notesWithUser)
})

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
    //Receives data from front end
    const{ user, title, text }=req.body

    //Confirm Data
    if(!user || !title || !text || !typeof(user)==mongoose.Schema.Types.ObjectId){
        return res.status(400).json({message:'All fields are required'})
    }

    //Check duplicates
    const duplicate=await Note.findOne({title}).lean().exec()

    if(duplicate){
        return res.status(409).json({message:'Duplicate Note Title'})
    }

    //save note
    const note = await Note.create({user, title, text})

    if(note){
        return res.status(201).json({message:`New Note ${title} created`})
    }else{
        return res.status(400).json({ message: 'Invalid note data received' })
    }

})

//@desc Update Note
//@route PATCH /notes
//@access Private
const updateNote=asyncHandler(async(req,res)=>{
    const{ id, user, title, text, completed }=req.body

    //Validate data
    if(!id || !user || !title || !text || typeof(completed)!=='boolean'){
        return res.status(400).json({message:'All fields are required'})
    }

    //check exists
    const note=await Note.findById(id).exec()

    if(!note){
        return res.status(400).json({message:'Note not found'})
    }

    //Check for Duplicates
    const duplicate = await Note.findOne({title}).lean().exec()
    //allow updates to the original User

    if(duplicate && duplicate?._id.toString()!==id){
        return res.status(409).json({message:'Duplicate note title'})
    }

    note.user=user
    note.title=title
    note.text=text
    note.completed=completed

    const updatedNote = await note.save() //need document, not lean 

    res.json({message:`'${updatedNote.title}' updated` })

})

//@desc Delete Note
//@route DELETE /notes
//@access Private
const deleteNote=asyncHandler(async(req,res)=>{
    const{id}=req.body
    //Validate ID
    if(!id){
        return res.status(400).json({message:'Note ID required'})
    }

    const note= await Note.findById(id).exec()
    if(!note){
        return res.status(400).json({message:'Note Not Found'})
    }

    const result = await note.deleteOne()

    const reply=`Note '${note.title}' with ID ${note._id} deleted`

    res.json(reply)
})

module.exports={ 
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}