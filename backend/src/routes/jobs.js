const express = require('express');
const { Job, Application } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
  const jobs = await Job.findAll();
  res.json(jobs);
});

router.post('/', async (req, res) => {
  // simplistic: in real app validate and check auth
  const { title, description, location, ownerId } = req.body;
  const job = await Job.create({ title, description, location, ownerId });
  res.json(job);
});

router.get('/:id', async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  if(!job) return res.status(404).json({error:'not found'});
  res.json(job);
});

router.post('/:id/apply', async (req, res) => {
  const jobId = req.params.id;
  const { applicantName, applicantEmail, resumeLink } = req.body;
  const application = await Application.create({ jobId, applicantName, applicantEmail, resumeLink });
  res.json(application);
});

module.exports = router;
