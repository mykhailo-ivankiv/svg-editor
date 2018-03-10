import React, { Component } from "react";
import { fromEvent, merge } from "most";

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
      .map(({ target }) => Number(target.dataset.lineIndex))
      .observe(index => this.setState({ activeElement: index }));

    const edit = mouseDown
      .filter(({ target }) => target.matches(".Editor__point"))

      .tap(ev => ev.preventDefault())
      .tap(ev => ev.stopPropagation())

      .map(({ target }) => target.dataset)
      .map(({ lineIndex, pointIndex }) => ({
        lineIndex: Number(lineIndex),
        pointIndex: Number(pointIndex)
      }))

      .chain(({ lineIndex, pointIndex }) => {
        const line = this.state.lines[lineIndex];

        return mouseMove.until(mouseUp).map(({ pageX, pageY }) => ({
          line: update(pointIndex, [pageX, pageY], line),
          activeElement: lineIndex
        }));
      });

    const create = mouseDown
      .filter(({ target }) => target.matches(".Editor__svg"))
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
          }));
      });

    merge(edit, create).observe(({ line, activeElement }) =>
      this.setState(({ lines }) => ({
        activeElement,
        lines: !lines[activeElement]
          ? append(line, lines)
          : update(activeElement, line, lines)
      }))
    );
  }

  render() {
    const { lines, activeElement } = this.state;

    return (
      <div className={b()}>
        {lines.length === 0 && <span className={b("greeting")}>click + drag to start edit</span>}
        <svg ref="root" className={b("svg")}>
          {lines.map(
            ([p1, p2], i) =>
              i !== activeElement ? (
                <line
                  key={i}
                  data-line-index={i}
                  className={b("line")}
                  x1={p1[0]}
                  x2={p2[0]}
                  y1={p1[1]}
                  y2={p2[1]}
                />
              ) : (
                <g key={i}>
                  <line
                    data-line-index={i}
                    className={b("line", ["active"])}
                    x1={p1[0]}
                    x2={p2[0]}
                    y1={p1[1]}
                    y2={p2[1]}
                  />
                  <circle
                    data-line-index={i}
                    data-point-index={0}
                    className={b("point")}
                    cx={p1[0]}
                    cy={p1[1]}
                    r={4}
                  />
                  <circle
                    data-line-index={i}
                    data-point-index={1}
                    className={b("point")}
                    cx={p2[0]}
                    cy={p2[1]}
                    r={4}
                  />
                </g>
              )
          )}
        </svg>
      </div>

    );
  }
}

export default Editor;
