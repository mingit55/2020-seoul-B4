import Tool from './Tool.js';
import Paper from './Paper.js';
import Source from './Source.js';

export default class Glue extends Tool {
    constructor(){
        super(...arguments);
        this.glueList = [];
    }   

    onmousedown(e){
        let target = this.getMouseTarget(e);

        if(target){
            if(!this.selected){
                target.active = true;
                this.selected = target;
                this.glueList.push(target);
            } 
            else if(this.selected.isNear(target)) {
                target.active = true;
                this.glueList.push(target);
            }
        } else {
            this.glueList = [];
            this.unselectAll();
        }
    }
    
    oncontextmenu(makeFunc){
        makeFunc([
            {name: "붙이기", onclick: this.accept},
            {name: "취소", onclick: this.cancel}
        ])
    }

    accept = e => {
        let first = this.glueList[0];
        let left = this.glueList.reduce((p, c) => Math.min(p, c.x), first.x);
        let top = this.glueList.reduce((p, c) => Math.min(p, c.y), first.y);
        let right = this.glueList.reduce((p, c) => Math.max(p, c.x + c.src.width), first.x + first.src.width);
        let bottom = this.glueList.reduce((p, c) => Math.max(p, c.y + c.src.height), first.y + first.src.height);

        let X = left;
        let Y = top;
        let W = right - left + 1;
        let H = bottom - top + 1;

        let src = new Source( new ImageData(W, H) );
        let sliced = document.createElement("canvas");
        sliced.width = W;
        sliced.height = H;
        let sctx = sliced.getContext("2d");
        
        this.glueList.forEach(glueItem => {
            sctx.drawImage(glueItem.sliced, glueItem.x - X, glueItem.y - Y);
            
            for(let y = glueItem.y; y < glueItem.y + glueItem.src.height; y++){
                for(let x = glueItem.x; x < glueItem.x + glueItem.src.width; x++){
                    let color = glueItem.src.getColor(x - glueItem.x, y - glueItem.y);
                    if(color){
                        src.setColor(x - X, y - Y, color);
                    }
                }
            }
        });

        src.borderData = src.getBorderData();
        
        let paper = new Paper(src);
        paper.sliced = sliced;
        paper.sctx = sctx;
        paper.x = X;
        paper.y = Y;
        paper.recalculate();
        
        this.ws.papers = this.ws.papers.filter(paper => !this.glueList.includes(paper));
        this.ws.papers.push(paper);

        this.cancel();
    }

    cancel = e => {
        this.glueList = [];
        this.unselectAll();
    };
}