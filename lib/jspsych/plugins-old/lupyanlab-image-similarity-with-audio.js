/*
* Example plugin template
*/

jsPsych.plugins['lupyanlab-image-similarity-with-audio'] = (function () {
    var plugin = {};

    //   jsPsych.pluginAPI.registerPreload('lupyanlab-image-similarity-with-audio', 'color_coord', 'image');
    //   jsPsych.pluginAPI.registerPreload('lupyanlab-image-similarity-with-audio', 'right_color', 'image');

    jsPsych.pluginAPI.registerPreload('lupyanlab-image-similarity-with-audio', 'audio', 'audio');
    //   jsPsych.pluginAPI.registerPreload('lupyanlab-image-similarity-with-audio', 'right_audio', 'audio');



    plugin.info = {
        name: 'lupyanlab-image-similarity-with-audio',
        parameters: {
            trial_progress_text: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Trial progress text',
                default: null,
                description: 'Text to display below progress bar',
            },
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: null,
                description: 'Prompt to display above the image',
            },
            color_coord: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Left Image',
                default: undefined,
                description: 'The image to be displayed on the left',
            },
            audio: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: 'Left Image',
                default: undefined,
                description: 'The image to be displayed on the left',
            },

            audio_start: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Left Image',
                default: undefined,
                description: 'The image to be displayed on the left',
            },
            audio_end: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Left Image',
                default: undefined,
                description: 'The image to be displayed on the left',
            },

            image_height: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Image height',
                default: null,
                description: 'Set the image height in pixels',
            },
            image_width: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Image width',
                default: null,
                description: 'Set the image width in pixels',
            },
            keys: {
                type: jsPsych.plugins.parameterType.COMPLEX,
                array: true,
                pretty_name: 'Choice keys',
                default: undefined,
                description: 'The keys the subject is allowed to press to respond to the image.',
            },
            labels: {
                type: jsPsych.plugins.parameterType.COMPLEX,
                array: true,
                pretty_name: 'Choice lables',
                default: undefined,
                description: 'The labels the subject is allowed to press to respond to the image.',
            },
            input_feedback_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Time for input feedback',
                default: null,
                description: 'Set the time for how long the input feedback lasts for.',
            },
        },
    };

    plugin.trial = function (display_element, trial) {
        console.log("input trial data", trial);

        const audio = jsPsych.pluginAPI.getAudioBuffer(`${trial.audio}`);
        // const right_audio = jsPsych.pluginAPI.getAudioBuffer(`${trial.right_audio}`);
        let listened_flags = false;

        display_element.innerHTML = /* html */ `
    <div id="part1">
    <button id="play-audio" style="cursor: pointer";> <img src="volume-icon.png" style="height:50px; width:50px"/> </button>
    </div>
    <div id="part2" style="display:flex; flex-direction:column; align-items:center;">
      ${trial.trial_progress_text !== null ? /* html */ `<h3>${trial.trial_progress_text}` : ''}
      ${trial.prompt !== null ? /* html */ `<h1>${trial.prompt}</h1>` : ''}
      <div style="display:flex; flex-direction:row; justify-content:space-between; width:500px; margin-top: 50px;">
        ${[0, 1].map((num, _idx) =>
            `<div id="img-${num}" data-name="${trial.labels[num]}" data-value="${num}" style="width:200px; height:200px; background-color:rgb(${trial.color_coord[num]});"> </div>`
        ).join('')}
      </div>
      <div style="display:flex; flex-direction:row; justify-content:space-between; width:500px; margin-top: 50px;">
      ${[2, 3].map((num, _idx) =>
            `<div id="img-${num}" data-name="${trial.labels[num]}" data-value="${num}" style="width:200px; height:200px; background-color:rgb(${trial.color_coord[num]});"> </div>`
        ).join('')}
      </div>
      <button style="visibility: hidden; margin-top: 25px;" id="img-${4}" data-name="${trial.labels[4]}" data-value="${4}"> I don't hear any music. </button>
    </div>
    `;
        const startTime = performance.now();

        const choice_elements = trial.keys.map((key) => document.getElementById(`img-${key}`));




        // choice_elements.forEach((choiceRadioEl) => {
        //     choiceRadioEl.addEventListener('click', () => end_trial(choiceRadioEl.getAttribute("data-value")));
        // });
        choice_elements.forEach((elem, idx) => {
            // if (idx < 4) {
            elem.style.cursor = "not-allowed";
            // } else {
            // elem.style.cursor = "pointer";
            // elem.addEventListener('click', () => end_trial(elem.getAttribute("data-value")));
            // }
        });





        let color_flags = false;
        let playing_flags = false;

        let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let source = audioCtx.createBufferSource();

        let timeout1 = null;
        let timeout2 = null;

        const play_button = document.getElementById("play-audio");
        const part1_page = document.getElementById('part1');
        const part2_page = document.getElementById('part2');


        const play_audio = () => {

            if (playing_flags === false) {

                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                source = audioCtx.createBufferSource();
                source.buffer = audio;
                source.connect(audioCtx.destination);

                const audio_duration = source.buffer.duration;
                source.start(when = 0, offset = 0, duration = audio_duration);
                playing_flags = true;
                console.log("start", listened_flags);
                console.log("audio  start");
                timeout1 = setTimeout(() => {
                    playing_flags = false;
                    console.log("audio finish");
                }, audio_duration * 1000);
                if (listened_flags === false) {
                    timeout2 = setTimeout(() => {
                        listened_flags = true;
                        if (listened_flags === true) {
                            //   // part1_page.style.display = "none";
                            // //   part2_page.style.display = "flex";
                            // choice_elements.forEach(elem => { elem.disabled = false; });

                            choice_elements.forEach(elem => {
                                elem.style.cursor = "pointer";
                            });
                            choice_elements.forEach((choiceRadioEl, idx) => {
                                choiceRadioEl.addEventListener('click', () => end_trial(choiceRadioEl.getAttribute("data-value")));
                                if (idx === 4) {
                                    choiceRadioEl.style.visibility = "visible";
                                }
                            });
                        }
                    }, audio_duration * 1000);
                }
            }
        };

        play_button.addEventListener('click', () => play_audio());


        // const reset_image_audio = (image_id, which_image) => {
        //   let audio_idx = -1;
        //   if (which_image === "left") {
        //     audio_idx = 0;
        //   } else if (which_image == "right") {
        //     audio_idx = 1;
        //   } else {
        //     console.log("wrong parameter 'which_image', should be 'left' or 'right':", which_image);
        //     return;
        //   }
        //   color_flags[audio_idx] = false;

        //   if ((listened_flags[audio_idx] === true) && (playing_flags[audio_idx] === true)) {
        //     source.stop();
        //     playing_flags[audio_idx] = false;
        //     console.log("audio idx finish (early)", audio_idx);
        //     clearTimeout(timeout1);
        //     clearTimeout(timeout2);
        //     console.log("timeout(s) cleared");
        //   }
        // };

        // color_coord.forEach((imageElement) => {
        //   imageElement.addEventListener('mouseenter', () => play_image_audio(imageElement.id, "left"));
        // });
        // color_coord.forEach((imageElement) => {
        //   imageElement.addEventListener('mouseleave', () => reset_image_audio(imageElement.id, "left"));
        // });
        // right_color.forEach((imageElement) => {
        //   imageElement.addEventListener('mouseenter', () => play_image_audio(imageElement.id, "right"));
        // });
        // right_color.forEach((imageElement) => {
        //   imageElement.addEventListener('mouseleave', () => reset_image_audio(imageElement.id, "right"));
        // });

        const end_trial = (selected_key) => {
            if (playing_flags === true) {
                playing_flags = false;
                source.stop();
                console.log("audio finished (early)");
                clearTimeout(timeout1);
                clearTimeout(timeout2);
                console.log("timeout(s) cleared");
            }

            console.log("selected_key", selected_key);
            console.log("all labels", trial.labels);
            choice_elements.forEach((choice_element) => (choice_element.disable = true));
            const endTime = performance.now();
            const rt = endTime - startTime;
            const selected_label = trial.labels[selected_key];
            console.log("selected label", selected_label);

            const trial_data = {
                rt: rt,
                key: selected_key,
                label: selected_label,
            };

            console.log("output trial data", trial_data);

            setTimeout(() => {
                jsPsych.finishTrial(trial_data);
            }, trial.input_feedback_duration);
        };

        jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: ({ key: keyCode }) => {
                const key = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(keyCode);
                document.getElementById(`plugin-radio-${key}`).checked = true;
                document.getElementById(`plugin-radio-${key}`).dispatchEvent(new Event('click'));
            },
            valid_responses: trial.keys.map((key) =>
                jsPsych.pluginAPI.convertKeyCharacterToKeyCode(String(key)),
            ),
            rt_method: 'performance',
            persist: false,
            allow_held_key: false,
        });
    };

    return plugin;
})();
