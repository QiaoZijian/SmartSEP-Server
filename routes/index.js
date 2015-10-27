var express = require('express');
var serveModel = require('../models/serveModel.js');
var router = express.Router();

/* GET  */
router.get('/chat', serveModel.getChatPage);
router.get('/stu', serveModel.getStuPage);
router.get('/tea', serveModel.getTeaPage);
router.get('/getClasses', serveModel.getClasses);
router.get('/getMyClasses', serveModel.getMyClasses);

/*
额外的，为了转成文件
 */
router.get('/classes', serveModel.getClassesPage);
router.get('/getOneClassFile', serveModel.getOneClassFile);

/* POST */
router.post('/submitClass', serveModel.submitClass);
router.post('/startClass', serveModel.startClass);
router.post('/endClass', serveModel.endClass);
module.exports = router;
