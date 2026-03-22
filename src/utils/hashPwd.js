const Bcrypt = require("bcryptjs");

const HashPassword = async (password) => {
  let salt = Bcrypt.genSaltSync(10);
  let hash = Bcrypt.hashSync(password, salt);
  return hash;
};

const comparePassword = async(password,hashPassword)=>{
  const compare = Bcrypt.compare(password,hashPassword);
  return compare
}

module.exports = {
  HashPassword,
  comparePassword
};
