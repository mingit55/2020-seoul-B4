export default class Tool {
    constructor(ws){
        this.ws = ws;
        this.selected = null;
    }

    getXY({pageX, pageY}){
        let {left, top} = $(this.ws.canvas).offset();
        let width = $(this.ws.canvas).width();
        let height = $(this.ws.canvas).height();

        let x = pageX - left;
        let y = pageY - top;
        
        x = x < 0 ? 0 : x >= width ? width : x;
        y = y < 0 ? 0 : y >= height ? height : y;
        
        return [x, y];
    }

    getMouseTarget(e){
        let [x, y] = this.getXY(e);
        
        for(let i = this.ws.papers.length - 1; i >= 0; i--){
            let paper = this.ws.papers[i];
            if(paper.src.getColor(x - paper.x, y - paper.y)){
                this.ws.papers.splice(i, 1);
                this.ws.papers.push(paper);
                return paper;
            }
        }

        return null;
    }

    unselectAll(){
        this.ws.papers.forEach(paper => paper.active = false);
        this.selected = null;
    }
}