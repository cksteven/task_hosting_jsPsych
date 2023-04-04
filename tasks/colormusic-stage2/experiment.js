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
  num_categories,
  dev,
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


  console.log("ALL TRIALS", trials);


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

  var xyY2XYZ = function (x, y, Y) {
    var X = (x / y) * Y;
    var Z = ((1 - x - y) / y) * Y;
    return [X / 100., Y / 100., Z / 100.];
  };

  var coords2rgb = function (coord) {
    var curr_color = new Color("color(xyz-d65 " + xyY2XYZ(coord.x, coord.y, coord.Y).join(" ") + ")").to("srgb");
    const r = parseInt(curr_color.r * 256);
    const g = parseInt(curr_color.g * 256);
    const b = parseInt(curr_color.b * 256);
    return `rgb(${r}, ${g}, ${b})`
  };

  var sliceIfDev = function (arr, num2keep = 3) {
    console.log("DEV", dev);
    if (dev == true) {
      return arr.slice(0, num2keep);
    } else {
      return arr
    }
  }

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

  if (!consent_agreed) timeline.push(consent_trial);

  const qualtrics_link = "https://uwmadison.co1.qualtrics.com/jfe/form/SV_9BQ9kjJqZR5FUrQ?workerId=" + worker_id;

  const instructions = {
    type: jsPsychInstructions,
    key_forward: 'space',
    key_backward: 'backspace',
    show_clickable_nav: true,
    pages: [
      /* html */ `
      <h1> Instruction TO CHANGE </h1>

      <p class="lead">In this experiment, you will hear about 20 short music clips. While listening to each one, you will see four colors. Your task is to choose the color that most goes with the music piece that is currently playing. You need to hear each piece until the end and can only make a selection at the end of the piece. Pay careful attention as sometimes you may be instructed to make a specific selection.
      </p> <p class="lead"> If you are not sure what color to choose, just go with whatever feels right.
      </p> <p class="lead">To hear each music piece, click on the sound icon. You can replay it by clicking it again, if you like.
      </p> <p class="lead">When you are done with this color selection task, you will be taken to a survey. Please make sure to carefully complete the survey, otherwise your research credit may not be approved.
        </p>`,
    ],
  };
  if (trials.length > 0) timeline.push(instructions);

  // const rel_audio_folder_path = rel_images_folder_path;

  const colorboard_trials = {
    type: jsPsychCustomColorboard,

    timeline: sliceIfDev(trials.filter(trial => trial.type == "colormusic"))
      .map((trial) => ({
      type: jsPsychCustomColorboard,
      color_coords: color_coords,
      audio: rel_audio_folder_path + "/" + trial.content.stimulus + ".mp3",
      prompt: `
      <h1> TEST TITLE </h1>
      <p> TEST PROMPT </p>
      `,
      promptA: `
      <p> Select 3 colors that you think are the MOST aligned to the music. </p>
      `,
      promptB: `
      <p> Select 3 colors that you think are the LEAST aligned to the music. </p>
      `,
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


  const coloralign_trials = {
    type: jsPsychHtmlSliderResponse,

    timeline: sliceIfDev(trials.filter(trial => trial.type == "color"))
      .map((trial) => ({
      type: jsPsychHtmlSliderResponse,
      stimulus: `<div style="
        height: 300px;
        width: 300px;
        background-color: ${coords2rgb(trial.content.color)};
      "></div>`,
      labels: [trial.content.anchors.anchor1, trial.content.anchors.anchor2],
      prompt: `
      <p> TEST PROMPT </p>
      `,
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

  timeline.push(coloralign_trials);

  const musicalign_trials = {
    type: jsPsychCustomAudioSliderResponse,

    timeline: sliceIfDev(trials.filter(trial => trial.type == "music"))
      .map((trial) => ({
      type: jsPsychCustomAudioSliderResponse,
      stimulus: `${rel_audio_folder_path}/${trial.content.music.stimulus}.mp3`,
      labels: [trial.content.anchors.anchor1, trial.content.anchors.anchor2],
      prompt: `
      <p> TEST PROMPT </p>
      `,
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

  timeline.push(musicalign_trials);


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
  timeline.push(jump_to_qualtrics);



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
