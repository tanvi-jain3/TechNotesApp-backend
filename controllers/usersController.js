const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler') //prevents from using try-catch blocks
const bcrypt = require('bcrypt') //hash password before saving

//@desc Get All Users
//@route GET /users
//@access Private
const getAllUsers= asyncHandler(async(req,res) =>{
    const users=await User.find().select('-password').lean()
    if(!users?.length){
        return res.status(400).json({message: 'No Users Found'})
    }
    res.json(users)
})

//@desc Create New User
//@route POST /users
//@access Private
const createNewUser= asyncHandler(async(req,res) =>{
    //Receives data from front end
    const{ username, password, roles }=req.body

    //Confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length){
        return res.status(400).json({message:'All fields are required'})
    }

    //Check for duplicates -> checkes databases for existing user
    const duplicate = await User.findOne({username}).lean().exec()

    //409 stands for conflict
    if(duplicate){
        return res.status(409).json({message : 'Duplicate Username'})
    }

    //Hash Password
    const hashedPwd = await bcrypt.hash(password,10) //salt rounds

    const userObject={ username, "password":hashedPwd, roles }

    //Create and store new Users
    const user= User.create(userObject)

    if(user){ //created
        res.status(201).json({message: `New User ${username} created`})
    }else{
        res.status(400).json({message:'Invalid User Data Received'})
    }

})

//@desc Update a User
//@route PATCH /users
//@access Private
const updateUser= asyncHandler(async(req,res) =>{

    const{id,username,roles,active,password}=req.body

    console.log("Received req body ", req.body)

    //Confirm Data
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !='boolean'){
        return res.status(400).json({message:'All fields are required'})
    }

    const user=await User.findById(id).exec()

    if(!user){
        return res.status(400).json({message:'User not found'})
    }

    //Check for Duplicates
    const duplicate = await User.findOne({username}).lean().exec()
    //allow updates to the original User

    if(duplicate && duplicate?._id.toString()!==id){
        return res.status(409).json({message:'Duplicate username'})
    }

    //Update user values (only those existing in User model)
    user.username=username
    user.roles=roles
    user.active=active

    if(password){
        //Hash Password
        user.password = await bcrypt.hash(password,10) //salt rounds
    }

    const updatedUser = await user.save() //need document, not lean 

    res.json({message:`${updatedUser.username} updated` })

})

//@desc Delete a User
//@route DELETE /users
//@access Private
const deleteUser= asyncHandler(async(req,res) =>{
    const {id} = req.body

    console.log("Request body ",req.body)

    if(!id){
        return res.status(400).json({message:'User ID Required'})
    }

    //Do not want to delete User if notes assigned to User
    const note= await Note.findOne({user:id}).lean().exec()
    if(note){
        return res.status(400).json({message:'User has assigned notes'})
    }

    const user=await User.findById(id).exec()

    if(!user){
        return res.status(400).json({message:'User Not Found'})
    }

    const result = await user.deleteOne()
    console.log("Result\n",result)

    const reply=`Username ${user.username} with ID ${user._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}