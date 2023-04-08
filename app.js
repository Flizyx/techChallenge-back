const express = require('express');
const { PrismaClient } = require('@prisma/client')
const { hashSync, compareSync } = require('bcrypt')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()
const app = express()

app.use(express.json())
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept,Authorization');
  next();
});
app.get('/', (req, res) => {
    res.send('Hola mundo')
})
const PORT = process.env.PORT || 3001



// app.post('/register', async (req, res) => {
//     try {
//         const { name, email, password } = req.body;
//         const hashedPassword = hashSync(password, 10);
//         const existingUser = await prisma.users.findUnique({
//             where: { email },
//         });

//         if (existingUser) {
//             res.status(500).json({ error: "User already exists" });
//         } else {
//             const user = await prisma.users.create({
//                 data: {
//                     name,
//                     email,
//                     password: hashedPassword,
//                     role: 'USER',
//                 },
//             });
//             const createdUser = await prisma.users.findUnique({
//                 where: { id: user.id },
//             });
//             res.json(createdUser);
//         }
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });


// get all classrooms
app.get('/classrooms', async (req, res) => {
  try {
      const classrooms = await prisma.classrooms.findMany()
      res.json(classrooms)
  } catch (error) {
      res.status(500).json({ error: error.message })
  }
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.users.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const passwordMatch = compareSync(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // const token = jwt.sign({ userId: user.id , role: user.role}, process.env.JWT_SECRET);
        const token = jwt.sign({ userId: user.id ,
           role: user.role, exp: Date.now() + (1000*(24*60 * 60))}, process.env.JWT_SECRET); //10 hours
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get one classroom by id
app.get('/classrooms/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        const classroom = await prisma.classrooms.findUnique({
            where: { id },
            include: { students: true }
        })
        if (classroom) {
            res.json(classroom)
        } else {
            res.status(404).json({ error: 'Classroom not found' })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// create a new classroom
app.post('/classrooms', authenticateToken,async (req, res) => {
    try {
        const { name, capacity } = req.body
        const classroom = await prisma.classrooms.create({
            data: { name, capacity }
        })
        res.status(201).json(classroom)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// update an existing classroom by id
app.put('/classrooms/:id',authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        const { name, capacity } = req.body
        const classroom = await prisma.classrooms.update({
            where: { id },
            data: { name, capacity }
        })
        res.json(classroom)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})
// delete specific classroom
app.delete('/classrooms/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if the classroom has any students
    const classroom = await prisma.classrooms.findUnique({
      where: { id },
      include: { students: true },
    });

    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    if (classroom.students.length > 0) {
      // Relocate students to another existing classroom
      const existingClassrooms = await prisma.classrooms.findMany({
        where: { id: { not: id } },
      });

      if (existingClassrooms.length === 0) {
        return res.status(400).json({ error: 'No other classrooms available to relocate students' });
      }

      const randomIndex = Math.floor(Math.random() * existingClassrooms.length);
      const newClassroom = existingClassrooms[randomIndex];

      const updateStudents = classroom.students.map((student) => {
        return prisma.students.update({
          where: { id: student.id },
          data: { classroom_id: newClassroom.id },
        });
      });

      await prisma.$transaction(updateStudents);
    }

    // Delete the classroom
    const deletedClassroom = await prisma.classrooms.delete({
      where: { id },
    });

    res.json(deletedClassroom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get all students
app.get('/students', async (req, res) => {
try {
    const students = await prisma.students.findMany({
    include: { classroom: true, siblings: true },
    });
    res.json(students);
} catch (error) {
    res.status(500).json({ error: error.message });
}
});
//get specific student
app.get('/students/:id', async (req, res) => {
try {
    const id = parseInt(req.params.id);
    const student = await prisma.students.findUnique({
    where: { id },
    include: { classroom: true, siblings: true },
    });
    const studentsWithSiblings = await prisma.students.findMany({
        include: {
          siblings: true
        },
        where: {
          siblings: {
            some: {}
          }
        }
      })
    res.json(student);
} catch (error) {
    res.status(500).json({ error: error.message });
}
});
//create student (auth required)
app.post('/students', authenticateToken, async (req, res) => {
try {
    const { name, gender, classroom_id,age,siblings } = req.body;
    const student = await prisma.students.create({
        data: { 
            name,
            gender,
            classroom_id,
            age,
            siblings 
        },
    include: { classroom: true,siblings:true },
    });
    res.json(student);
} catch (error) {
    res.status(500).json({ error: error.message });
}
});
//create student siblings
app.post('/students/:id/siblings', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { siblings } = req.body;
      // Check if siblings already exist
      const existingSiblings = await prisma.siblings.findMany({
        where: {
          OR: [
            {
              student_id: parseInt(id),
              sibling_id: { in: siblings },
            },
            {
              student_id: { in: siblings },
              sibling_id: parseInt(id),
            },
          ],
        },
      });
      if (existingSiblings.length > 0) {
        return res.status(400).json({
          error:
          'One or more of the provided siblings already exist for this student.',
        });
      }
      // Create the siblings
      const newSiblings = await Promise.all(
        siblings.map((siblingId) =>
          prisma.siblings.create({
            data: {
              student: {
                connect: { id: parseInt(id) },
              },
              sibling_id: siblingId,
            },
          })
        )
      );
  
      // Connect the siblings to the student
      const updatedStudent = await prisma.students.update({
        where: { id: parseInt(id) },
        data: {
          siblings: {
            connect: newSiblings.map((sibling) => ({ id: sibling.id })),
          },
        },
        include: { siblings: true },
      });
  
      res.json(updatedStudent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
//search specific student siblings
app.get('/students/:id/siblings2', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the student's siblings
      const siblings = await prisma.siblings.findMany({
        where: {
          OR: [
            { student_id: parseInt(id) },
            { sibling_id: parseInt(id) },
          ],
        },
        include: { 
          student: true,
        },
      });
  
      if (siblings.length === 0) {
        return res.json({
          message: 'this student does not have siblings',
        });
      }

      const siblingsWithInfo = await Promise.all(siblings.map(async (sibling) => {
        const siblingInfo = await prisma.students.findUnique({
          where: {
            id: sibling.sibling_id,
          },
        });

        return {
          id: sibling.id,
          student_id: sibling.student_id,
          sibling_id: sibling.sibling_id,
          student: sibling.student,
          sibling: siblingInfo,
        };
      }));
  
      res.json(siblingsWithInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  //get specific student siblings info with class info
app.get('/students/:id/siblings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the student's siblings
    const siblings = await prisma.siblings.findMany({
      where: {
        OR: [
          { student_id: parseInt(id) },
          { sibling_id: parseInt(id) },
        ],
      },
      include: { 
        student: {
          include: {
            classroom: true,
          }
        },
      },
    });

    if (siblings.length === 0) {
      return res.json({
        message: 'this student does not have siblings',
      });
    }

    const siblingsWithInfo = await Promise.all(siblings.map(async (sibling) => {
      const siblingInfo = await prisma.students.findUnique({
        where: {
          id: sibling.sibling_id,
        },
        include: {
          classroom: true,
        },
      });

      return {
        id: sibling.id,
        student_id: sibling.student_id,
        sibling_id: sibling.sibling_id,
        student: {
          ...sibling.student,
          classroom_name: sibling.student.classroom.name,
        },
        sibling: {
          ...siblingInfo,
          classroom_name: siblingInfo.classroom.name,
        },
      };
    }));

    res.json(siblingsWithInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//delete student sibling
app.delete('/students/siblings/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const sibling = await prisma.siblings.delete({
            where: { id },
        });
        res.json(sibling);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// modify student (auth req)
app.put('/students/:id', authenticateToken, async (req, res) => {
try {
    const id = parseInt(req.params.id);
    const { name, gender, classroom_id,age,siblings  } = req.body;
    const student = await prisma.students.update({
    where: { id },
    data: { name, gender, classroom_id,age,siblings  },
    include: { classroom: true,siblings:true },
    });
    res.json(student);
} catch (error) {
    res.status(500).json({ error: error.message });
}
});
//delete student
app.delete('/students/:id', authenticateToken, async (req, res) => {
try {
    const id = parseInt(req.params.id);
    const student = await prisma.students.delete({
    where: { id },
    include: { classroom: true },
    });
    res.json(student);
} catch (error) {
    res.status(500).json({ error: error.message });
}
});
// validate if a user has admin privileges
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {return res.sendStatus(403);}
        if (user.role !== 'ADMIN') return res.sendStatus(403);
        if (user.exp < Date.now()) return res.sendStatus(401);
        req.user = user;
        next();
    });
}
app.listen(PORT, () =>
    console.log('server ready at: http://localhost:'+PORT)
);