/**
 * This imports all the plugins without having to
 * manually add each a new script element!
 */
export default () => {
    const pluginsPath = '../../lib/jspsych/plugins/';
    return axios.get(pluginsPath).then(({ data: content }) => (
        // console.log('data', data),
        // console.log('content', content),
        console.log('list of plugins', content.files.filter(e => e.ext == "js").map((file) => file.title).filter(e => e != null)),
        Promise.all(
            content.files.filter(e => e.ext == "js").map((file) => file.title).filter(e => e != null).map((plugin) => {
                const script = document.createElement('script');
                return new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    script.src = pluginsPath + plugin;
                    document.head.appendChild(script);
                });
            }),
        )
    )
    );
};
