const express = require('express');
const http = require("http");
const {Server} = require("socket.io");
const cors = require("cors");
const app = express();
const route = require("./route");
const {addUser, findUser, getRoomUsers, removeUser} = require("./users");

app.use(cors({origin: "*"}));
app.use(route);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// обработка события подключения нового клиента к серверу:
// обращаемся к серверу и подписываемся на событие подключения
// когда какой-нибудь пользователь будет подключаться к серверу, будет отрабатывать коллбэк функция,
// которая получает в качестве параметра объект socket, представляющий одно конкретное подключение
io.on('connection', (socket) => {

    // на этот socket мы вешаем слушатель событий join и передаем коллбэк
    // то есть здесь обрабатывается событие присоединения пользователя к комнате
    // когда клиент отправляет запрос на присоединение к комнате, сервер принимает данные о имени name и комнате room
    socket.on('join', ({name, room}) => {
        // добавляем текущий сокет клиента в определенную комнату, указанную в данных запроса
        socket.join(room);

        // вызываем функцию addUser для добавления user в список пользователей комнаты
        const {user, isExist} = addUser({name, room});
        // console.log('is exist: ', isExist);
        // если пользователь уже в комнате, выдаем одно сообщение от администратора, иначе другое
        const userMessage = isExist ? `${user.name}, here you go again` : `Hello, ${name}`;

        // сервер отправляет сообщение клиенту от админа, используя событие "message"
        socket.emit('message', {
            data: {user: {name: 'admin'}, message: userMessage}
        });

        // сервер отправляет сообщение всем клиентам в данной комнате, кроме текущего клиента
        socket.broadcast.to(user.room).emit('message', {
            // сервер отправляет сообщение о присоединении нового пользователя в комнате
            data: {user: {name: 'admin'}, message: `User ${name} has joined the room`}
        });

        // сервер отправляет обновленную информацию о пользователе всем клиентам в данной комнате, используя событие "room"
        io.to(user.room).emit('room', {
            data: {users: getRoomUsers(user.room)}
        })
    });

    // обработка события отправки сообщения sendMessage
    // когда клиент (user) отправляет сообщение в чат, сервер получает данные о сообщении message и параметрах params
    socket.on('sendMessage', ({message, params}) => {
        // находим с помощью функци findUser пользователя в списке пользователей по заданным параметрам
        const user = findUser(params);
        // если есть такой пользователь
        if (user) {
            // сервер отправляет сообщение пользователя всем клиентам в данной комнате
            // то есть все пользователи комнаты получают сообщение одного из пользователей
            // и в зависимости от автора сообщения, на фронте отображаем сообщение справа или слева
            io.to(user.room).emit('message', {data: {user, message}})
        }
    });

    // обработка события покидания комнаты leftRoom
    // когда клиент покидает комнату, сервер получает данные о параметрах
    socket.on('leftRoom', ({params}) => {
        // удаляем пользователя из списка пользователей по заданным параметрам с помощью функции removeUser
        const user = removeUser(params);

        // если такой пользователь существует
        if (user) {
            const {room, name} = user;

            // сервер отправляет сообщение всем клиентам в данной комнате,
            // информируя о том, что пользователь покинул комнату
            io.to(room).emit('message', {
                data: {user: {name: 'admin'}, message: `${name} has left the room`}
            })

            // сервер отправляет обновленную информацию о пользователях
            // всем клиентам в данной комнате, используя событие "room"
            io.to(room).emit("room", {
                data: {users: getRoomUsers(room)}
            })
        }
    });

    // обрабатываем событие разрыва соединения (disconnect)
    // когда клиент отключается от сервера, выполняется функция обратного вызова
    io.on('disconnect', () => {
        console.log('Disconnect');
    });
});

server.listen(4000, () => {
    console.log('Server is running');
});