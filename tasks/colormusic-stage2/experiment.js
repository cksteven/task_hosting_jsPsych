import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import api from '../../utils/api.js';
import demographics_questions from './demograhpics.js';
import searchParams from '../../utils/search-params.js';
import Color from "../../lib/color.js";
// import Color from "https://colorjs.io/dist/color.js";
// import Color from "https://colorjs.io/src/color.js";
import Konva from "../../node_modules/konva/lib/Core.js";
import { Rect } from '../../node_modules/konva/lib/shapes/Rect.js';
// import Konva from "../../lib/konva.js";


const {
  workerId: worker_id,
  fullscreen,
  reset,
  num_categories
} = searchParams;


(async () => {
  await loadJsPsychPlugins();

  const {
    trials,
    num_trials,
    color_coords,
    completed_demographics,
    consent_agreed,
    rel_images_folder_path,
    // rel_audio_folder_path
  } = await api({
    fn: 'trials',
    kwargs: { worker_id, reset, num_categories },
  });

  const timeline = [];

  var preload = {
    type: jsPsychPreload,
    auto_preload: true
  }
  timeline.push(preload);

  const rel_audio_folder_path = './music_short';
  const rel_audiocheck_path = './audiocheck';

  const fullscreen_trial = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: '<p>Please press continue to switch to full-screen mode</p>',
    button_label: 'Continue',
  };

  if (fullscreen) timeline.push(fullscreen_trial);

  // const dev = true;

  const colorboard_trials = {
    type: jsPsychCustomColorboard,

    timeline: trials.map((trial) => ({
      type: jsPsychCustomColorboard,
      color_coords: color_coords,
      colorjs: Color,
      // konvajs: Konva,
      on_start: () => {
        console.log("DEBUG: trials", trial);
      },
      on_finish: ({ rt, response }) => {
        console.log("rt and response", rt, response);
        const data = {
          subj_code: worker_id,
          response: response,
          rt,
          trial,
        };

        api({
          fn: 'data',
          kwargs: {
            worker_id,
            data,
            order: Object.keys(data),
          },
        });
      },
    })),
  };
  timeline.push(colorboard_trials);


  const consent_trial = {
    type: jsPsychCustomConsent,
    url: './consent.html',
    alert:
      'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
    on_finish: () => {
      api({ fn: 'consent', kwargs: { worker_id } });
    },
    on_start: () => {
      console.log("DEBUG: trials", trials);
    }
  };

  // if (!consent_agreed) timeline.push(consent_trial);

  const continue_space = /* html */ `<div class='right small'>(press SPACE to continue)</div>`;

  const qualtrics_link = "https://uwmadison.co1.qualtrics.com/jfe/form/SV_bJ9xVld2PXvp0ns?workerId=" + worker_id;

  const instructions_assess = {
    type: jsPsychInstructions,
    pages: [
      /* html */ `
      <h1> TEXT TO BE CHANGED</h1>
      <p> Before you start the main task, we have a few example questions to demostrate what is a typical round or spiky object.</p>

      <p>
      Before you start the main task, we have four short <b>audio questions</b> to make sure you speak English well enough to participate.
      </p><p>
      These questions are very easy, but you will need to <b>turn up the sound on your computer</b> to be able to hear the questions.
      </p><p>
      Please make sure you answer these four questions correctly. If you answer incorrectly we may not compensate you for your participation.
      </p>
      `,
    ],
    show_clickable_nav: true,
  };
  // if (trials.length > 0) timeline.push(instructions_assess);

  const assess_block = {
    type: jsPsychAudioButtonResponse,
    input_feedback_duration: 500,
    timeline: trials
      .filter(trial => trial.type === "assess")
      .map((trial) => ({
        type: jsPsychAudioButtonResponse,
        prompt:
      /*html*/ `<br>This is an <b>audio question</b>, please make sure the sound on your computer is on.<br>
      To replay the question, <b>press R</b> on your keyboard.`,

        stimulus: rel_audiocheck_path + '/' + trial.music + ".mp3",
        choices: trial.color.split(','),

        questions: [{ prompt: '', name: '', rows: 1, columns: 30, required: true }],
        on_start: () => {
          jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
        },
        on_finish: ({ rt, response }) => {
          const data = {
            subj_code: worker_id,
            choice_label: response,
            response: response,
            rt,
            ...trial,
          };

          api({
            fn: 'data',
            kwargs: {
              worker_id,
              data,
              order: Object.keys(data),
            },
          });
        },
      })),
  };
  // timeline.push(assess_block);


  const instructions = {
    type: jsPsychInstructions,
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      /* html */ `
      <h1> Instruction </h1>

      <p class="lead">In this experiment, you will hear about 20 short music clips. While listening to each one, you will see four colors. Your task is to choose the color that most goes with the music piece that is currently playing. You need to hear each piece until the end and can only make a selection at the end of the piece. Pay careful attention as sometimes you may be instructed to make a specific selection.
      </p> <p class="lead"> If you are not sure what color to choose, just go with whatever feels right.
      </p> <p class="lead">To hear each music piece, click on the sound icon. You can replay it by clicking it again, if you like.
      </p> <p class="lead">When you are done with this color selection task, you will be taken to a survey. Please make sure to carefully complete the survey, otherwise your research credit may not be approved.
        </p> ${continue_space}`,
    ],
  };
  // if (trials.length > 0) timeline.push(instructions);

  // const rel_audio_folder_path = rel_images_folder_path;

  const helper_minute_second = (minute_colon_second) => {
    const minute = parseInt(minute_colon_second.split(":")[0]);
    const second = parseInt(minute_colon_second.split(":")[1]);
    const res = minute * 60 + second;
    // console.log(minute, second, res);
    return res;
  }

  const randomize_lr = (trial) => {
    console.log("before lr rand:", trial);
    // if (Math.random() >= 0.5) return trial;
    let modified_trial = Object.assign({}, trial);
    let color_coord = JSON.parse(trial.color_coord.replace(/'/g, '"'));
    let new_colors = Object.keys(color_coord).sort(() => Math.random() - 0.5);
    let new_coords = new_colors.map(key => color_coord[key].toString());
    modified_trial.color = new_colors;
    modified_trial.color_coord = new_coords;
    console.log("after lr rand:", modified_trial);
    //     // swap color1,color2,coord1,coord2,music1,music2,start1,start2
    //     modified_trial.color1 = trial.color2;
    //     modified_trial.color2 = trial.color1;
    //     modified_trial.coord1 = trial.coord2;
    //     modified_trial.coord2 = trial.coord1;
    //     modified_trial.music1 = trial.music2;
    //     modified_trial.music2 = trial.music1;
    //     modified_trial.start1 = trial.start2;
    //     modified_trial.start2 = trial.start1;
    //     console.log("one trial was LEFT-RIGHT SWAPPED from source trial list data");

    return modified_trial;
  }

  // const image_trials_block = {
  //     type: 'lupyanlab-image-similarity-with-audio',
  //     input_feedback_duration: 500,
  //     // Nested timeline:  https://www.jspsych.org/overview/timeline/#nested-timelines
  //     timeline: trials
  //         .filter(trial => trial.type != "assess")
  //         .map(trial => randomize_lr(trial))
  //         .map((trial) => ({
  //             //   trial_progress_text: `Trial ${Number(trial.trial_number)} of ${num_trials}`,
  //             // prompt: `How similar is ${trial.object}?`,
  //             //   prompt: `How similar is PLACEHOLDER TEXT?`,
  //             // image: rel_images_folder_path + '/' + trial.image_1,
  //             // right_image: rel_images_folder_path + '/' + trial.image_2,
  //             // color_coord: Object.values(JSON.parse(trial.color_coord.replace(/'/g, '"'))).map(x => x.toString()),
  //             color_coord: trial.color_coord,
  //             //   right_color: trial.coord2,
  //             // audio: rel_audio_folder_path + '/' + 'image.mp3',
  //             // right_audio: rel_audio_folder_path + '/' + 'right_image.mp3',
  //             audio: rel_audio_folder_path + '/' + trial.music + ".mp3",
  //             //   right_audio: rel_audio_folder_path + '/' + trial.music2 + ".mp3",
  //             audio_start: 0,
  //             //   right_audio_start: helper_minute_second(trial.start2),
  //             audio_end: 15,
  //             //   right_audio_end: helper_minute_second(trial.start2) + 15,
  //             //   shape_image: trial.shape_image,
  //             keys: trial.color.map((_, i) => `${i}`).concat(['4']),
  //             labels: trial.color.concat(["I don'hear any music."]),
  //             on_start: () => {
  //                 jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
  //             },
  //             on_finish: ({ rt, key, label }) => {
  //                 const data = {
  //                     subj_code: worker_id,
  //                     choice_label: label,
  //                     choice_key: key,
  //                     rt,
  //                     ...trial,
  //                 };

  //                 console.log("data at finish:", data);

  //                 api({
  //                     fn: 'data',
  //                     kwargs: {
  //                         worker_id,
  //                         data,
  //                         order: Object.keys(data),
  //                     },
  //                 });
  //             },
  //         })),
  // };
  // timeline.push(image_trials_block);

  // const demographics_questions_instructions = {
  //     type: 'instructions',
  //     key_forward: 'space',
  //     key_backward: 'backspace',
  //     pages: [
  //         `<p class="lead">Thank you! We'll now ask a few demographic questions and you'll be done!
  //   </p> ${continue_space}`,
  //     ],
  // };
  // if (!completed_demographics) timeline.push(demographics_questions_instructions);

  // const demographics_trial = {
  //     type: 'lupyanlab-surveyjs',
  //     questions: demographics_questions,
  //     on_finish: ({ response }) => {
  //         api({ fn: 'demographics', kwargs: { worker_id, demographics: response } });
  //     },
  // };
  // if (!completed_demographics) timeline.push(demographics_trial);

  const jump_to_qualtrics = {
    type: jsPsychInstructions,
    pages: [`<p> You will be redirected to a new page containing some survey questions. </p>
        <p> Please complete the survey in the new page. </p>
        <p> Reward will be offered only if you complete the survey. </p> <br />
        <p> If you are not being redirected automatically in 10s, please click this link:
        <a href="${qualtrics_link}"  target="_blank">${qualtrics_link} </a>
        </p> <br />
        <p> After you complete the survey, please feel free to close this page. </p>
        `],
    // show_clickable_nav: true,
    on_start: () => {
      console.log("qualtrics link:", qualtrics_link);
      setTimeout(() => {
        window.open(qualtrics_link, '_blank');
      }, 7000);
    }
  }
  // timeline.push(jump_to_qualtrics);



  //create random code for final message
  const randLetter = () => {
    var a_z = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var int = Math.floor(Math.random() * a_z.length);
    var rand_letter = a_z[int];
    return rand_letter;
  };

  var secretCode = 'zhrz'; // this is the 'key'
  var code = '';

  for (let i = 0; i < 7; i++) {
    code = code.concat(randLetter());
  }

  code = code.concat(secretCode);

  for (let i = 0; i < 7; i++) {
    code = code.concat(randLetter());
  }


  const debrief_block = {
    type: jsPsychHtmlKeyboardResponse,
    choices: [],
    stimulus: function () {
      return /* html */ `Thank you for participating!
      <p>The purpose of this HIT is to assess the extent to which different people think irrelevant concepts are similar.</p>
      <br><br>
      <center>Your completion code for mTurk is</center>
      <br>
      <center><u><b style="font-size:20px">${code}</b></u></center>
      <br>
      <center>Please copy/paste this code into the mTurk box'</center>
      <br>
      If you have any questions or comments, please email qliu295@wisc.edu.`;
    },
  };
  // timeline.push(debrief_block);

  // jsPsych.init({
  //     timeline: timeline,
  //     fullscreen,
  //     show_progress_bar: true,
  //     auto_update_progress_bar: false,
  // });

  var jsPsych = initJsPsych({
    fullscreen,
    show_progress_bar: true,
    auto_update_progress_bar: false,
  });
  jsPsych.run(timeline);
})();
