import Tool from '/js/entry/Tool.js';
import Source from './Source.js';
import Paper from './Paper.js';

export default class Cut extends Tool {
    constructor(){
        super(...arguments);

        this.sliced = this.ws.sliced;
        this.sctx = this.sliced.getContext("2d");
        this.sctx.setLineDash([5, 5]);
        this.sctx.lineWidth = 1;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.ws.canvas.width;
        this.canvas.height = this.ws.canvas.height;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.lineWidth = 1;
    }   

    ondblclick(e){
        let target = this.getMouseTarget(e);
        
        if(target && this.selected === null){
            target.active = true;
            this.selected = target;
        }
    }

    onmousedown(e){
        if(!this.selected) return;

        let [x, y] = this.getXY(e);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);

        this.sctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.sctx.beginPath();
        this.sctx.moveTo(x, y);
    }

    onmousemove(e){
        if(!this.selected) return;

        let [x, y] = this.getXY(e);
        
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.sctx.lineTo(x, y);
        this.sctx.stroke();
    }

    oncontextmenu(makeFunc){
        if(!this.selected) return;
    
        makeFunc([
            {name: "자르기", onclick: this.accept},
            {name: "취소", onclick: this.cancel}
        ]);
    }

    accept = e => {
        if(!this.selected) return;

        let target = this.selected;
        let src = target.src;
        let srcList = [];
        let slicedArr = [];
        let slicedSrc = new Source( this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height) );

        this.ws.papers = this.ws.papers.filter(paper => paper !== target);
        
        
        for(let y = target.y; y < target.y + src.height; y++){
            for(let x = target.x; x < target.x + src.width; x++){
                if(slicedSrc.getColor(x, y)){
                    slicedArr.push([x - target.x, y - target.y]);
                    src.setColor(x - target.x, y - target.y, [0, 0, 0, 0]);
                }
            }
        }

        for(let y = 0; y < src.height; y++){
            for(let x = 0; x < src.width; x++){
                if(!src.getColor(x, y)) continue;

                let newSrc = new Source( new ImageData(src.width, src.height) );
                let checkList = [ [x, y] ];

                while(checkList.length > 0){
                    let [x, y] = checkList.pop();
                    let left = false, right = false;

                    while(src.getColor(x, y - 1)) y--;
                    
                    do {
                        let color = src.getColor(x, y);
                        if(!color) break;
                        
                        src.setColor(x, y, [0, 0, 0, 0]);
                        newSrc.setColor(x, y, color);

                        if(src.getColor(x-1, y)){
                            if(left === false){
                                checkList.push([x-1, y]);
                                left = true;
                            }
                        } else left = false;

                        if(src.getColor(x+1, y)){
                            if(right === false){
                                checkList.push([x+1, y]);
                                right = true;
                            }
                        } else right = false;
                    } while( src.getColor(x, ++y) );
                }

                srcList.push(newSrc);
            }
        }

        srcList.forEach(src => {
            let paper = new Paper(src);
            paper.x = target.x;
            paper.y = target.y;
            
            slicedArr.forEach(([x, y]) => paper.sctx.fillRect(x, y, 1, 1));
            paper.sctx.drawImage(target.sliced, 0, 0);

            paper.recalculate();
            this.ws.papers.push(paper);
        });

        this.cancel();
    };

    cancel(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.sctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.unselectAll();
    }
}