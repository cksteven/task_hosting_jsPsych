// import taskName from '../../utils/task-name.js';
import task from './task-name.js';

export default async (msg) => {
  const PORTFILEPATH = `../tasks/${task}/port.js`;
  return import(PORTFILEPATH)
    .then((module) => {
      console.log("imported PORT", module.default);
      const PORT = module.default;
      const ENDPOINT = `https://${window.location.hostname}:${PORT}`;

      const searchParams = new URLSearchParams(window.location.search);
      const dev = searchParams.get('dev') === 'true';
      return axios.post(ENDPOINT, { task, dev, ...msg }).then(({ data }) => data);
    });
};
