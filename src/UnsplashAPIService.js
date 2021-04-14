import axios from 'axios';

const accessKey = '-jmqbTF7-AL6325WhrwK-TEbKh1sfZuWk0qdKj9cWXc';
// const secretKey = 'sEUhbRjbreyVWWaJZdKRMTPx0mU6vcoiYeQcFv2w0XE';
const host = 'https://api.unsplash.com';

const APIService = () => {
    const axiosInst = axios.create({
        baseURL: host,
        timeout: 2000,
        headers: {'Authorization': `Client-ID ${accessKey}`}
    });

    return {
        getImageList: (page) => {
            return new Promise((resovle, reject) => {
                axiosInst.get('/photos', {params: {page}})
                    .then(res => resovle(res.data))
                    .catch(err => reject(err))
            })
        }
    };
}

const _inst = APIService();
export default _inst;
