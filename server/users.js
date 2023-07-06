const {trimStr} = require("./utils");
let users = [];

const findUser = (user) => {
    const userName = trimStr(user.name);
    const userRoom = trimStr(user.room);

    return users.find(
        (user) => trimStr(user.name) === userName && trimStr(user.room) === userRoom
    );
}


//добавление пользователя в комнату
const addUser = (user) => {
    const isExist = findUser(user);
    //console.log("users: ", users)

    !isExist && users.push(user);

    const currentUser = isExist || user;

    return {isExist: !!isExist, user: currentUser};
};

const getRoomUsers = (room) => users.filter((user) => user.room === room);

const removeUser = (user) => {
    const found = findUser(user);

    if (found) {
        users = users.filter(
            ({room, name}) => room === found.room && name === found.name
        );
    }

    return found;
}

module.exports = {addUser, findUser, getRoomUsers, removeUser};