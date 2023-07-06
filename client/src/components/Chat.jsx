import React, {useEffect, useState} from 'react';
import io from "socket.io-client";
import {useLocation, useNavigate} from "react-router-dom";
import styles from "../styles/Chat.module.css";
import icon from "../images/emoji.svg";
import EmojiPicker from "emoji-picker-react";
import Messages from "./Messages";

const socket = io.connect("http://localhost:4000");

const Chat = () => {
    const {search} = useLocation();
    const navigate = useNavigate();
    const [params, setParams] = useState({room: "", user: ""});
    const [state, setState] = useState([]);
    const [message, setMessage] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState(0);

    useEffect(() => {
        // извлекаем параметры запроса room и user из объекта search
        const searchParams = Object.fromEntries(new URLSearchParams(search));
        setParams(searchParams);
        // отправляем событие "join" на сервер, передавая значения room и user
        socket.emit('join', searchParams);
    }, [search]);

    // когда сервер отправляет событие "message", будет вызан коллбэк с переданными событием данными data
    useEffect(() => {
        socket.on('message', ({data}) => {
            setState(_state => [..._state, data]);
        });
    }, []);

    // когда сервер отправляет событие "room", коллбэк функция будет вызвана с  полученными от сервера данными о пользователях
    useEffect(() => {
        socket.on('room', ({data: {users}}) => {
            setUsers(users.length);
        });
    }, []);

    // console.log(params);
    // console.log(state);

    //
    const leftRoom = () => {
        socket.emit("leftRoom", {params});
        navigate('/');
    }

    const handleChange = ({target: {value}}) => {
        setMessage(value)
    }

    const handleEmojiClick = ({emoji}) => {
        setMessage(`${message}${emoji}`)
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!message) return;

        socket.emit("sendMessage", {message, params});
        setMessage("");
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div className={styles.title}>{params.room}</div>
                <div className={styles.users}>{users} users in the room</div>
                <button
                    className={styles.left}
                    onClick={leftRoom}>
                    Left the room
                </button>
            </div>
            <div className={styles.messages}>
                <Messages messages={state} name={params.name}/>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.input}>
                    <input
                        type="text"
                        name="message"
                        value={message}
                        placeholder="Write the message"
                        onChange={handleChange}
                        autoComplete="off"
                        required
                    />
                </div>
                <div className={styles.emoji}>
                    <img
                        src={icon}
                        alt="emoji"
                        onClick={() => setIsOpen(!isOpen)}
                    />
                    {isOpen && (
                        <div className={styles.emojies}>
                            <EmojiPicker onEmojiClick={handleEmojiClick}/>
                        </div>
                    )}
                </div>
                <div className={styles.button}>
                    <input
                        type="submit"
                        onSubmit={handleSubmit}
                        value="Send"
                    />
                </div>
            </form>
        </div>
    );
}

export default Chat;