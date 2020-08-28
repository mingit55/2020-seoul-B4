import Tool from '/js/entry/Tool.js';

export default class Select extends Tool {
    constructor(){
        super(...arguments);
        this.mouseTarget = null;
    }   

    onmousedown(e){
        let target = this.getMouseTarget(e);
        if(target){
            let [x, y] = this.getXY(e);
            target.active = true;

            this.selected = target;
            this.mouseTarget = target;

            this.beforeXY = [target.x, target.y];
            this.downXY = [x, y];
        } else {
            this.unselectAll();
        }
    }

    onmousemove(e){
        if(!this.mouseTarget) return;
        
        let [x, y] = this.getXY(e);
        let [dx, dy] = this.downXY;
        let [bx, by] = this.beforeXY;
        
        this.selected.x = bx + x - dx;
        this.selected.y = by + y - dy;
    }

    onmouseup(e){
        this.mouseTarget = null;
    }
}