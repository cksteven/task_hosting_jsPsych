// import taskName from '../../utils/task-name.js';
import task from './task-name.js';
const PORT = 7117; // NEED TO BE CHANGED MANUALLY

const ENDPOINT = `http://${window.location.hostname}:${PORT}`;

const searchParams = new URLSearchParams(window.location.search);
const dev = searchParams.get('dev') === 'true';

export default (msg) => axios.post(ENDPOINT, { task, dev, ...msg }).then(({ data }) => data);
