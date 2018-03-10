import React, { Component } from "react";
import { fromEvent } from "most";

import "../styles/Editor.less";
import block from "../helpers/BEM";
import { append, last, update } from "ramda";

const b = block("Editor");

const hypotenuse = (a, b) => Math.sqrt(a * a + b * b);

class Editor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeElement: null,
      lines: []
    };
  }

  componentDidMount() {
    const mouseDown = fromEvent("mousedown", this.refs.root);
    const mouseMove = fromEvent("mousemove", this.refs.root);
    const mouseUp = fromEvent("mouseup", this.refs.root);

    const click = fromEvent("click", this.refs.root);

    click
      .filter(({ target }) => target.matches(".Editor__line"))
      .map(({ target }) => target)
      .map(({ dataset }) => dataset.index)
      .observe(index => this.setState({ activeElement: index }));

    mouseDown
      .map(ev => [ev.pageX, ev.pageY])

      .chain(p1 => {
        const index = this.state.lines.length;
        return mouseMove
          .until(mouseUp)
          .filter(({ pageX, pageY }) => {
            const p2 = [pageX, pageY];

            const delta = hypotenuse(
              Math.abs(p1[0] - p2[0]),
              Math.abs(p1[1] - p2[1])
            );

            return delta >= 20;
          })
          .map(({ pageX, pageY }) => ({
            line: [p1, [pageX, pageY]],
            activeElement: index
          }))
      })

      .observe(({line, activeElement}) => {

        this.setState(({ lines }) => {
          if (!lines[activeElement]) {
            return this.setState({
              activeElement: activeElement,
              lines: append(line, lines)
            })
          } else {
            return ({
              activeElement: activeElement,
              lines: update(activeElement, line, lines)
            })
          }

        });
      });
    return mouseMove.until(mouseUp);
  }

  render() {
    const { lines, activeElement } = this.state;

    let p1, p2;

    if (lines[activeElement]) {
      [p1, p2] = lines[activeElement];
    }

    return (
      <svg ref="root" className={b()}>
        {lines.map(
          ([p1, p2], i) =>
            i !== activeElement ? (
              <line
                data-index={i}
                key={i}
                className={b("line")}
                x1={p1[0]}
                x2={p2[0]}
                y1={p1[1]}
                y2={p2[1]}
              />
            ) : (
              undefined
            )
        )}

        {lines[activeElement] && (
          <g>
            <line
              data-index={activeElement}
              className={b("line", ["active"])}
              x1={p1[0]}
              x2={p2[0]}
              y1={p1[1]}
              y2={p2[1]}
            />
            <circle className={b("point")} cx={p1[0]} cy={p1[1]} r={5} />
            <circle className={b("point")} cx={p2[0]} cy={p2[1]} r={5} />
          </g>
        )}
      </svg>
    );
  }
}

export default Editor;
