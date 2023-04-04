var jsPsychCustomColorboard = (
  function (jspsych) {
    'use strict';

    const info = {
      name: "custom-colorboard",
      parameters: {
        color_coords: {
          type: jspsych.ParameterType.OBJECT,
          default: undefined,
        },
      },
    };
    /**
    * **image-keyboard-response**
    *
    * jsPsych plugin for displaying an image stimulus and getting a keyboard response
    *
    * @author Josh de Leeuw
    * @see {@link https://www.jspsych.org/plugins/jspsych-image-keyboard-response/ image-keyboard-response plugin documentation on jspsych.org}
    *
    * @author Kesong Cao
    */
    class CustomColorboardPlugin {
      constructor(jsPsych) {
        this.jsPsych = jsPsych;
      }
      trial(display_element, trial) {
        var Color = trial.colorjs;
        const stage_width = 800;
        const stage_height = 800;
        const indiv_length = 80;
        const indiv_space = indiv_length / 4;

        var event_status = "initial";
        var hidden = [];
        var click_count = 0;

        display_element.insertAdjacentHTML("beforeend", `
        <div id="prompt">
          <h1> TEST TITLE </h1>
          <p> test prompt </p>
        </div>`
        );

        console.log("Konva object", Konva);
        display_element.insertAdjacentHTML("beforeend", `<div id="container"></div>`);
        var stage = new Konva.Stage({
          container: "container",
          width: stage_width,
          height: stage_height,
        });
        console.log("stage", stage);

        var layer = new Konva.Layer();
        trial.color_coords
          .filter((coord) => coord.column == 0 && coord.row == 0)
          .forEach((coord) => {
            const curr_color = new Color("color(xyz-d65 " + this.xyY2XYZ(coord.x, coord.y, coord.Y).join(" ") + ")").to("srgb");
            // ctx.strokeStyle = "rgba(0, 0, 0, 0)";
            var rect = new Konva.Rect({
              x: 0,
              y: 0,
              width: stage_width,
              height: stage_height,
              fill: `rgb(${curr_color.r * 256.}, ${curr_color.g * 256.}, ${curr_color.b * 256.})`,
            });
            layer.add(rect);
            // ctx.fillRect(0, 0, canvas.width, canvas.height);
          });
        trial.color_coords.forEach((coord) => {
          // console.log(coord);
          // console.log(coord.x, coord.y, coord.Y);
          // console.log('xyY2XYZ', this.xyY2XYZ(coord.x, coord.y, coord.Y));
          const curr_color = new Color("color(xyz-d65 " + this.xyY2XYZ(coord.x, coord.y, coord.Y).join(" ") + ")").to("srgb");
          const row = parseInt(coord.row);
          const col = parseInt(coord.column);
          const r = parseInt(curr_color.r * 256);
          const g = parseInt(curr_color.g * 256);
          const b = parseInt(curr_color.b * 256);
          // console.log("row, col", row, col);
          // console.log("color", `rgb(${curr_color.r * 256.}, ${curr_color.g * 256.}, ${curr_color.b * 256.})`);
          if (row > 0 && col > 0) {
            // ctx.fillStyle = `green`;
            // ctx.strokeStyle = "blue";
            const x = parseInt(col * indiv_length + (col - 1) * indiv_space);
            const y = parseInt(row * indiv_length + (row - 1) * indiv_space);
            var rect = new Konva.Rect({
              x: x,
              y: y,
              width: indiv_length,
              height: indiv_length,
              fill: `rgb(${r}, ${g}, ${b})`,
              row: row,
              col: col,
            });
            rect.on('click', (event) => {
              // console.log("CLICK event", event);
              console.log("CLICK target", event.target);
              console.log("CLICK row col", event.target.attrs.row, event.target.attrs.col);
              console.log("EVENT STATUS before", event_status);

              // handle event, remove rect
              if (event_status == "initial" && click_count < 3) {
                event.target.hide();
                hidden.push(event.target);
                click_count += 1;
                if (click_count == 3) {
                  event_status = "half";
                  click_count = 0;
                  hidden.forEach((rect) => {
                    rect.show();
                  });
                }
              } else if (event_status == "half" && click_count < 3) {
                event.target.hide();
                hidden.push(event.target);
                click_count += 1;
                if (click_count == 3) {
                  event_status = "done";
                  click_count = 0;

                  // data saving
                  var trial_data = {
                    response: hidden.map((rect) => [rect.attrs.row, rect.attrs.col]),
                    // rt: "NOT IMPLEMENTED",
                    rt: -1,
                  };
                  // end trial
                  this.jsPsych.finishTrial(trial_data);
                }
              }
              console.log("EVENT STATUS after", event_status);
              console.log("CLICK count", click_count);
            })
            layer.add(rect);
          }
        });
        stage.add(layer);
      }

      // private methods
      xyY2XYZ(x, y, Y) {
        var X = (x / y) * Y;
        var Z = ((1 - x - y) / y) * Y;
        return [X / 100., Y / 100., Z / 100.];
      }
    }
    CustomColorboardPlugin.info = info;

    return CustomColorboardPlugin;

  })(jsPsychModule);
