const express = require("express");
  const jwt = require("jsonwebtoken");
  const { authMiddleware } = require("./middleware");
  const { JWT_SECRET } = require("./config");
  const User = require("./models/User");
  const Organization = require("./models/Organization");
  const Board = require("./models/Board");
  const Issue = require("./models/Issue");

  const router = express.Router();

  // ====== AUTH ======
  router.post("/signup", async (req, res) => {
      const { username, password } = req.body;

      if (!username || !password) {
          return res.status(411).json({
              message: "username and password are required"
          });
      }

      try {
          const userExists = await User.findOne({ username });
          if (userExists) {
              return res.status(411).json({
                  message: "User with this username already exists"
              });
          }

          await User.create({ username, password });

          res.json({
              message: "You have signed up successfully"
          });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.post("/signin", async (req, res) => {
      const { username, password } = req.body;

      try {
          const userExists = await User.findOne({ username });
          if (!userExists || !(await userExists.comparePassword(password))) {
              return res.status(403).json({
                  message: "Incorrect credentials"
              });
          }

          const token = jwt.sign(
              { userId: userExists._id.toString() },
              JWT_SECRET
          );

          res.json({ token });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  // ====== ORGANIZATIONS ======
  router.post("/organization", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const { title, description } = req.body;

      if (!title) {
          return res.status(411).json({ message: "title is required" });
      }

      try {
          const org = await Organization.create({
              title,
              description: description || "",
              admin: userId,
              members: []
          });

          res.json({
              message: "Org created",
              id: org._id
          });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.post("/add-member-to-organization", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const { organizationId, memberUsername } = req.body;

      try {
          const organization = await Organization.findById(organizationId);
          if (!organization || organization.admin.toString() !== userId) {
              return res.status(411).json({
                  message: "Either this org doesn't exist or you are not an admin of this org"
              });
          }

          const memberUser = await User.findOne({ username: memberUsername });
          if (!memberUser) {
              return res.status(411).json({
                  message: "No user with this username exists in our db"
              });
          }

          if (organization.members.some((m) => m.toString() ===
  memberUser._id.toString())) {
              return res.status(411).json({
                  message: "User is already a member of this organization"
              });
          }

          organization.members.push(memberUser._id);
          await organization.save();

          res.json({ message: "New member added!" });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.get("/organizations", authMiddleware, async (req, res) => {
      const userId = req.userId;

      try {
          const orgs = await Organization.find({
              $or: [{ admin: userId }, { members: userId }]
          }).select("title description admin members createdAt").populate("admin", "id username");

          res.json({ organizations: orgs });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.get("/organization", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const organizationId = req.query.organizationId;

      try {
          const organization = await Organization.findById(organizationId)
              .populate("members", "id username")
              .populate("admin", "id username");

          if (!organization) {
              return res.status(411).json({
                  message: "Organization doesn't exist"
              });
          }

          const isAdmin = organization.admin._id.toString() === userId;
          const isMember = organization.members.some((m) => m._id.toString() === userId);
          if (!isAdmin && !isMember) {
              return res.status(411).json({
                  message: "You are not part of this organization"
              });
          }

          res.json({
              organization: {
                  id: organization._id,
                  title: organization.title,
                  description: organization.description,
                  admin: organization.admin,
                  members: organization.members
              }
          });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.get("/users", authMiddleware, async (req, res) => {
      try {
          const users = await User.find({}, "username").sort({ username: 1 }).limit(50);
          res.json({ users });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.delete("/members", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const { organizationId, memberUsername } = req.body;

      try {
          const organization = await Organization.findById(organizationId);
          if (!organization || organization.admin.toString() !== userId) {
              return res.status(411).json({
                  message: "Either this org doesn't exist or you are not an admin of this org"
              });
          }

          const memberUser = await User.findOne({ username: memberUsername });
          if (!memberUser) {
              return res.status(411).json({
                  message: "No user with this username exists in our db"
              });
          }

          organization.members = organization.members.filter(
              (m) => m.toString() !== memberUser._id.toString()
          );
          await organization.save();

          res.json({ message: "member deleted!" });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  // ====== BOARDS ======
  router.post("/board", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const { title, description, organizationId } = req.body;

      if (!title || !organizationId) {
          return res.status(411).json({ message: "title and organizationId are required" });
      }

      try {
          const organization = await Organization.findById(organizationId);
          if (!organization) {
              return res.status(411).json({ message: "Organization doesn't exist" });
          }

          const isAdmin = organization.admin.toString() === userId;
          const isMember = organization.members.some((m) => m.toString() ===
  userId);
          if (!isAdmin && !isMember) {
              return res.status(411).json({
                  message: "You are not part of this organization"
              });
          }

          const board = await Board.create({
              title,
              description: description || "",
              organization: organizationId,
              createdBy: userId,
              members: []
          });

          res.json({
              message: "Board created",
              id: board._id
          });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.get("/boards", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const organizationId = req.query.organizationId;

      try {
          const orgIds = await Organization.find({
              $or: [{ admin: userId }, { members: userId }]
          }).select("_id");

          const allowedOrgIds = orgIds.map((o) => o._id.toString());
          if (organizationId && !allowedOrgIds.includes(organizationId)) {
              return res.status(411).json({
                  message: "You are not part of this organization"
              });
          }

          const query = organizationId
              ? { organization: organizationId }
              : { organization: { $in: orgIds.map((o) => o._id) } };

          const boards = await Board.find(query).populate("createdBy", "id username");

          res.json({ boards });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  // ====== ISSUES ======
  router.post("/issue", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const { title, description, boardId, status, priority, assignedTo } =
  req.body;

      if (!title || !boardId) {
          return res.status(411).json({ message: "title and boardId are required" });
      }

      try {
          const board = await Board.findById(boardId);
          if (!board) {
              return res.status(411).json({ message: "Board doesn't exist" });
          }

          let assignedUserId = null;
          if (assignedTo) {
              const assignee = await User.findOne({ username: assignedTo });
              if (!assignee) {
                  return res.status(411).json({
                      message: "Assigned user doesn't exist"
                  });
              }
              assignedUserId = assignee._id;
          }

          const issue = await Issue.create({
              title,
              description: description || "",
              status: status || "todo",
              priority: priority || "medium",
              board: boardId,
              organization: board.organization,
              createdBy: userId,
              assignedTo: assignedUserId
          });

          res.json({
              message: "Issue created",
              id: issue._id
          });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.get("/issues", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const { boardId, organizationId, status } = req.query;

      try {
          const query = {};
          if (boardId) {
              const board = await Board.findById(boardId);
              if (!board) {
                  return res.status(411).json({ message: "Board doesn't exist" });
              }

              const organization = await Organization.findById(board.organization).select("admin members");
              if (!organization) {
                  return res.status(411).json({ message: "Organization doesn't exist" });
              }

              const isAdmin = organization.admin.toString() === userId;
              const isMember = organization.members.some((m) => m.toString() === userId);
              if (!isAdmin && !isMember) {
                  return res.status(411).json({ message: "You are not part of this organization" });
              }

              query.board = boardId;
          } else if (organizationId) {
              const organization = await Organization.findById(organizationId).select("admin members");
              if (!organization) {
                  return res.status(411).json({ message: "Organization doesn't exist" });
              }

              const isAdmin = organization.admin.toString() === userId;
              const isMember = organization.members.some((m) => m.toString() === userId);
              if (!isAdmin && !isMember) {
                  return res.status(411).json({ message: "You are not part of this organization" });
              }

              query.organization = organizationId;
          } else {
              const orgIds = await Organization.find({
                  $or: [{ admin: userId }, { members: userId }]
              }).select("_id");
              query.organization = { $in: orgIds.map((o) => o._id) };
          }

          if (status) {
              query.status = status;
          }

          const issues = await Issue.find(query)
              .populate("createdBy", "id username")
              .populate("assignedTo", "id username");

          res.json({ issues });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.delete("/issue", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const { issueId } = req.body;

      if (!issueId) {
          return res.status(411).json({ message: "issueId is required" });
      }

      try {
          const issue = await Issue.findById(issueId);
          if (!issue) {
              return res.status(411).json({ message: "Issue doesn't exist" });
          }

          if (issue.createdBy.toString() !== userId) {
              return res.status(411).json({
                  message: "Only the issue creator can delete the issue"
              });
          }

          await Issue.findByIdAndDelete(issueId);
          res.json({ message: "Issue deleted" });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  router.put("/issues", authMiddleware, async (req, res) => {
      const userId = req.userId;
      const { issueId, title, description, status, priority, assignedTo } =
  req.body;

      if (!issueId) {
          return res.status(411).json({ message: "issueId is required" });
      }

      try {
          const issue = await Issue.findById(issueId);
          if (!issue) {
              return res.status(411).json({ message: "Issue doesn't exist" });
          }

          // Check if user is member or admin of the organization
          const organization = await Organization.findById(issue.organization);
          const isCreator = issue.createdBy.toString() === userId;
          const isOrgMember = organization && (organization.admin.toString() === userId || organization.members.some(m => m.toString() === userId));

          // Allow org members to update status (move issues), but only creator can update other fields
          if (!isOrgMember) {
              return res.status(411).json({
                  message: "You are not part of this organization"
              });
          }

          // Only the creator can update title, description, priority, and assignee
          if (!isCreator && (title !== undefined || description !== undefined || priority !== undefined || assignedTo !== undefined)) {
              return res.status(411).json({
                  message: "Only the issue creator can update these fields"
              });
          }

          if (title !== undefined) issue.title = title;
          if (description !== undefined) issue.description = description;
          if (status !== undefined) issue.status = status;
          if (priority !== undefined) issue.priority = priority;

          if (assignedTo !== undefined) {
              if (assignedTo === null || assignedTo === "") {
                  issue.assignedTo = null;
              } else {
                  const assignee = await User.findOne({ username: assignedTo
  });
                  if (!assignee) {
                      return res.status(411).json({
                          message: "Assigned user doesn't exist"
                      });
                  }
                  issue.assignedTo = assignee._id;
              }
          }

          await issue.save();

          res.json({
              message: "Issue updated",
              issue
          });
      } catch (err) {
          res.status(500).json({ message: "Internal server error", error:
  err.message });
      }
  });

  module.exports = router;