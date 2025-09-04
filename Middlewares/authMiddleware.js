
// import jwt from 'jsonwebtoken';
// import Recruiter from '../Models/Recruiter.js';
// // or whatever your recruiter model is

// export const protect = async (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     try {
//       token = req.headers.authorization.split(' ')[1];

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       req.user = await Recruiter.findById(decoded.id).select('-password'); // ✅ attaches user

//       next();
//     } catch (error) {
//       console.error('Auth Error:', error);
//       return res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   }

//   if (!token) {
//     return res.status(401).json({ message: 'Not authorized, no token' });
//   }
// };

// export default protect;


import jwt from 'jsonwebtoken';
import Recruiter from '../Models/Recruiter.js';
import CandidateRegister from '../Models/CandidateRegister.js';
import Admin from '../Models/AdminSchema.js'; // if you have an admin model

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find the user in all roles
      let user =
        (await Recruiter.findById(decoded.id).select('-password')) ||
        (await CandidateRegister.findById(decoded.id).select('-password')) ||
        (await Admin.findById(decoded.id).select('-password'));

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach user and role
      req.user = user;
      req.user.role = user instanceof Recruiter
        ? 'recruiter'
        : user instanceof CandidateRegister
        ? 'candidate'
        : 'admin';

      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export default protect;
