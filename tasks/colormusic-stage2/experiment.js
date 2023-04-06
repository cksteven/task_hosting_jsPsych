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

  var jsPsych = initJsPsych({
    fullscreen,
    show_progress_bar: true,
    auto_update_progress_bar: false,
  });

  console.log("ALL TRIALS", trials);


  const timeline = [];

  var preload = {
    type: jsPsychPreload,
    auto_preload: true
  }

  timeline.push(preload);

  const rel_audio_folder_path = './music_short';
  const rel_second_audio_folder_path = './control_task_music';

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
      <p> There are four tasks in this experiment.
      When you are done with all four tasks, you will be taken to a survey.
      Please make sure to carefully complete all tasks and the survey,
      otherwise your credit (or payment?) may not be approved.
      </p>

      <p> In the first task, you will hear about 30 short music clips.
      While listening to each one, you will see a matrix of colors.
      Your task is to choose the three colors that are most <b>consistent</b>
      with the music piece that is currently playing.
      You need to hear each piece at least once before you could begin
      selecting colors.
      </p>

      <p> Please choose the most, the second-most, and the third-most
      <b>consistent</b> color in that order. The color will disappear as it is selected.
      As you finish selecting the three most consistent colors,
      all colors will reappear on the screen, and you will need to choose
      the three colors that are most <b>inconsistent</b> with the music.
      </p>

      <p> Similarly, please choose the most, second-most, and third-most
      <b>inconsistent</b> colors in that order.
      Again, the color will disappear as it is selected.
      </p>

      <p> The music will loop until all six color choices had been made
      for each selection.
      </p>

      <p> Once you have completed the selection of inconsistent colors,
      you will move on to the next music clip and repeat the process.
      </p>

      <p> If you are not sure what color to choose,
      just go with whatever feels right.
      </p>
    `,
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
          console.log("DEBUG: trial", trial);
          jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
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

  const instructions2 = {
    type: jsPsychInstructions,
    key_forward: 'space',
    key_backward: 'backspace',
    show_clickable_nav: true,
    pages: [
      /* html */ `
      <p> Thank you for completing the first task!
      If you need a break, feel free to take one.
      When you are ready to continue,
      please read the introduction to the second task below carefully.
      </p>

      <p> How fast is red? How wet is green? How do you like purple?
      In the second task, you will see colors and rate them along various scales like these.
      </p>

      <p> You can rate it by typing the number on your keyboard,
      or clicking the number directly on the screen.
      As you make the selection, it will automatically move on to the next rating.
      </p>

      <p> You might find that some scales are not relevant to colors.
      For example, it might not be obvious how serious or passive a color is.
      For these, please follow your instincts and go with your first impression.
      </p>
    `,
    ],
  };
  if (trials.length > 0) timeline.push(instructions2);

  const coloralign_trials = {
    type: jsPsychHtmlButtonResponse,

    timeline: sliceIfDev(trials.filter(trial => trial.type == "color"))
      .map((trial) => ({
        type: jsPsychHtmlButtonResponse,
        stimulus: `<div style="
        height: 500px;
        width: ${document.body.clientWidth};
        background-color: ${coords2rgb(trial.content.color)};
      "></div>`,
        choices: [1, 2, 3, 4, 5, 6, 7],
        button_html: `<button class="jspsych-btn"
        style="
        height: 100px;
        width: 100px;
        "
        >%choice%</button>`,
        // labels: [trial.content.anchors.anchor1, trial.content.anchors.anchor2],
        prompt: `
      <p> 1 = most ${trial.content.anchors.anchor1} </p>
      <p> 7 = most ${trial.content.anchors.anchor2} </p>
      <p> TEST PROMPT </p>
      `,
        on_start: () => {
          console.log("DEBUG: trials", trial);
          jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
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

  const instructions3 = {
    type: jsPsychInstructions,
    key_forward: 'space',
    key_backward: 'backspace',
    show_clickable_nav: true,
    pages: [
          /* html */ `
          <p> Thank you for completing the second task!
          If you need a break, feel free to take one.
          When you are ready to continue, please read the introduction to the third task below carefully.
          </p>

          <p> The third task you are about to do is to rate music clips on various scales,
          just like what you have just done for colors.
          </p>

          <p> You need to hear each piece at least once before you could begin
          rating it on various scales.
          The music will loop until it has been rated on all scales.
          </p>

          <p> Again, some scales are not relevant to music.
          Please follow your instincts and go with your first impression.
          </p>
        `,
    ],
  };
  if (trials.length > 0) timeline.push(instructions3);

  const musicalign_trials = {
    type: jsPsychCustomAudioButtonResponse,

    timeline: sliceIfDev(trials.filter(trial => trial.type == "music"))
      .map((trial) => ({
        type: jsPsychCustomAudioButtonResponse,
        stimulus: `${rel_audio_folder_path}/${trial.content.music.stimulus}.mp3`,
        choices: [1, 2, 3, 4, 5, 6, 7],
        button_html: `<button class="jspsych-btn"
        style="
        height: 100px;
        width: 100px;
        "
        >%choice%</button>`,
        // labels: [trial.content.anchors[0].anchor1, trial.content.anchors[0].anchor2],
        labels_mul: trial.content.anchors.map(anchor => [anchor.anchor1, anchor.anchor2]),
        prompt: `
      <p> TEST PROMPT </p>
      `,
        on_start: () => {
          console.log("DEBUG: trials", trial);
          jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
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

  const instructions4 = {
    type: jsPsychInstructions,
    key_forward: 'space',
    key_backward: 'backspace',
    show_clickable_nav: true,
    pages: [
          /* html */ `
          <p> Thank you for completing the third task! You are almost there!
          If you need a break, feel free to take one.
          When you are ready to continue, please read the introduction to the last task below carefully.
          </p>

          <p> For the last task, you will be presented with three music clips in each trial.
          The clips will automatically play in the order of the first, second,
          and third clip. After listening to all three clips, you need to
          determine which of the latter two clips is more similar to the first
          clip by clicking on the sound icon. Once you have made your selection,
          you will proceed to the next trial.
          </p>

          <p> It's important to note that unlike the previous tasks,
          the music clips will not loop in this task. Therefore, it's crucial
          that you remain focused and attentive throughout the task to make accurate selections.
          </p>
        `,
    ],
  };
  if (trials.length > 0) timeline.push(instructions4);

  const musicmusic_trials = {
    type: jsPsychCustomMusicmusic,

    timeline: sliceIfDev(trials.filter(trial => trial.type == "musicmusic"))
      .map((trial) => ({
        type: jsPsychCustomMusicmusic,
        audio: rel_second_audio_folder_path + "/" + trial.content.music + ".mp3",
        audio2: rel_second_audio_folder_path + "/" + (trial.content.left == "like" ? trial.content.like : trial.content.dislike)  + ".mp3",
        audio3: rel_second_audio_folder_path + "/" + (trial.content.left == "like" ? trial.content.dislike : trial.content.like) + ".mp3",
        prompt: `
      <h1> TEST TITLE </h1>
      <p> TEST PROMPT </p>
      `,
        on_start: () => {
          console.log("DEBUG: trials", trial);
          jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
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

  timeline.push(musicmusic_trials);


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


  jsPsych.run(timeline);
})();
