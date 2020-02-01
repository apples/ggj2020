// /** @jsx createJSXElement */
import { createJSXElement } from "../ui/createjsxelement";
import { JSXElement } from "../ui/interfaces";
import { Scene } from "THREE";
import { Component } from "../ui/component";

/**
 * Game state's UI elements
 */

 interface Props {
    ticks: number,
    clicks: number,
    color: string,
    hidden: boolean,
    hover: () => void,
    plunge: () => void,
    addClick: () => void,
    toggle: () => void,
}

interface State {
//     ticks: number;
//     clicks: number;
//     color: string;
}

export class Test extends Component<Props, State> {
    constructor(props: Props, scene: Scene) {
        super(props, scene);
    }

    render(): JSXElement {
        return(
            <div>
                <panel height="70" width="200" color="#1f22dc" top="685" left="1180" >
                    <panel left = "-50" z_index="1" height="50" width="50" color="#1f22dc" img="./data/textures/cottage.png">
                        <label z_index="2" top="10" color="#ffffff" contents={this.props.ticks.toString()}></label>
                    </panel>
                    <panel left="50" height="50" width="50" color="#1f22dc" img="./data/textures/cottage.png" onClick={()=> this.props.addClick()}>
                        <label z_index="2" top="10" color="#ffffff" contents={this.props.clicks.toString()}></label>
                    </panel>
                </panel>
            </div>

        )
    }
}