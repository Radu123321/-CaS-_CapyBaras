const crypto = require('crypto');
const log = require('../core/logger');
const userRepo = require('../repositories/userRepository');
const authService = require('../services/authService');

function hash(p){return crypto.createHash('sha256').update(p).digest('hex');}

// GET /api/users
async function listUsers(req,res){
  try{
    const list = await userRepo.list();
    res.status(200).json({success:true,data:list});
  }catch(e){
    log.error(`listUsers: ${e.message}`);
    res.status(500).json({success:false,error:'Failed to list users'});
  }
}

// GET /api/users/:id
async function getUser(req,res){
  const id = parseInt(req.params.id||0);
  if(!id){return res.status(400).json({success:false,error:'Invalid id'});}  
  try{
    const u = await userRepo.get(id);
    if(u) return res.json({success:true,data:u});
    return res.status(404).json({success:false,error:'Not found'});
  }catch(e){
    log.error(`getUser: ${e.message}`);
    res.status(500).json({success:false,error:'Failed'});
  }
}

// POST /api/users
async function createUser(req,res){
  try{
    const {email,password,role='EMPLOYEE',branch_id=null,first_name,last_name,phone} = req.body;
    if(!email||!password) return res.status(400).json({success:false,error:'email and password required'});
    const id = await userRepo.create({
      email:email.toLowerCase(),
      pwdHash:hash(password),
      role,branchId:branch_id,firstName:first_name,lastName:last_name,phone
    });
    const newU = await userRepo.get(id);
    res.status(201).json({success:true,data:newU});
  }catch(e){
    log.error(`createUser: ${e.message}`);
    res.status(500).json({success:false,error:'Failed to create user'});
  }
}

// PUT /api/users/:id
async function updateUser(req,res){
  const id = parseInt(req.params.id||0);
  if(!id) return res.status(400).json({success:false,error:'Invalid id'});
  try{
    const existing = await userRepo.get(id);
    if(!existing) return res.status(404).json({success:false,error:'User not found'});
    const {email=existing.email,role=existing.role,branch_id=existing.branch_id,first_name=existing.first_name,last_name=existing.last_name,phone=existing.phone}=req.body||{};
    const updated = await userRepo.update(id,{email,role,branchId:branch_id,firstName:first_name,lastName:last_name,phone});
    res.json({success:true,data:updated});
  }catch(e){
    log.error(`updateUser: ${e.message}`);
    res.status(500).json({success:false,error:'Failed to update'});
  }
}

// DELETE /api/users/:id
async function deleteUser(req,res){
  const id = parseInt(req.params.id||0);
  if(!id) return res.status(400).json({success:false,error:'Invalid id'});
  try{
    await userRepo.remove(id);
    res.json({success:true});
  }catch(e){
    log.error(`deleteUser: ${e.message}`);
    res.status(500).json({success:false,error:'Failed to delete'});
  }
}

module.exports={listUsers,getUser,createUser,updateUser,deleteUser}; 