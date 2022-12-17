/**
 * This imports all the plugins without having to
 * manually add each a new script element!
 */
export default () => {
    const pluginsPath = '../../lib/jspsych/plugins/';
    return axios.get(pluginsPath).then(({ data: content }) => (
        // console.log('data', data),
        console.log('list of plugins', content.files.map((file) => file.name).filter(e => e != null)),
        Promise.all(
            content.files.map((file) => file.name).filter(e => e != null).map((plugin) => {
                const script = document.createElement('script');
                return new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    script.src = pluginsPath + plugin + ".js";
                    document.head.appendChild(script);
                });
            }),
        )
    )
    );
};
