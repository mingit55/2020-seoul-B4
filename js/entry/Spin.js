import Tool from '/js/entry/Tool.js';
import Source from './Source.js';

export default class Spin extends Tool {
    constructor(){
        super(...arguments);
    }   

    ondblclick(e){
        let target = this.getMouseTarget(e);

        if(target !== null && this.selected === null){
            target.active = true;   
            target.recalculate();

            this.selected = target;
            this.prevImage = target.src;
            this.prevSliced = document.createElement("canvas");
            this.prevSliced.width = target.sliced.width;
            this.prevSliced.height = target.sliced.height;
            let psctx = this.prevSliced.getContext("2d");
            psctx.drawImage(target.sliced, 0, 0);

            this.image = document.createElement("canvas");
            this.image.width = target.src.width;
            this.image.height = target.src.height;
            let ctx = this.image.getContext("2d");
            ctx.putImageData(target.src.imageData, 0, 0);

            this.sliced = document.createElement("canvas");
            this.sliced.width = target.sliced.width;
            this.sliced.height = target.sliced.height;
            let sctx = this.sliced.getContext("2d");
            sctx.drawImage(target.sliced, 0, 0);

            let [,,W,H] = target.src.getSize();
            let wantSize = Math.sqrt(Math.pow(W, 2) + Math.pow(H, 2));
            let moveX = (wantSize - this.image.width) / 2;
            let moveY = (wantSize - this.image.height) / 2;

            target.canvas.width = target.canvas.height = wantSize;
            target.sliced.width = target.sliced.height = wantSize;
            target.x -= moveX;
            target.y -= moveY;

            this.canvas = document.createElement("canvas");
            this.canvas.width = this.canvas.height = wantSize;
            this.ctx = this.canvas.getContext("2d");
         
            this.ctx.drawImage(this.image, moveX, moveY);
            target.src = new Source(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            
            
            target.sctx.clearRect(0, 0, wantSize, wantSize);
            target.sctx.drawImage(this.sliced, moveX, moveY);
        }
    }

    onmousedown(e){
        if(!this.selected) return false;

        this.prevX = e.pageX;
    }

    onmousemove(e){
        if(!this.selected) return false;

        let x = e.pageX;
        let target = this.selected;
        let angle = -(x - this.prevX) * Math.PI / 180;
        this.prevX = x;

        let size = this.canvas.width
        let center = size / 2;
        let moveX = center - this.image.width / 2;
        let moveY = center - this.image.height / 2;
        
        this.ctx.translate(center, center);
        this.ctx.rotate(angle);
        this.ctx.translate(-center, -center);

        this.ctx.clearRect(0, 0, size, size);
        this.ctx.drawImage(this.image, moveX, moveY);
        target.src = new Source( this.ctx.getImageData(0, 0, size, size) );
        
        this.ctx.clearRect(0, 0, size, size);
        this.ctx.drawImage(this.sliced, moveX, moveY);
        target.sctx.putImageData( this.ctx.getImageData(0, 0, size, size), 0, 0 );
    }

    oncontextmenu(makeFunc){
        if(!this.selected) return;

        makeFunc([
            {name: "확인", onclick: this.accept},
            {name: "취소", onclick: this.cancel}
        ])
    }

    accept = e => {
        if(!this.selected) return;

        this.selected.recalculate();
        this.unselectAll();
    };

    cancel = e => {
        if(!this.selected) return;

        let target = this.selected;

        let moveX = (this.canvas.width - this.image.width) / 2;
        let moveY = (this.canvas.height - this.image.height) / 2;

        target.canvas.width = this.prevImage.width;       
        target.canvas.height = this.prevImage.height;
        target.src = this.prevImage;
        
        target.x += moveX;
        target.y += moveY;

        target.sliced = this.prevSliced;

        this.unselectAll();
    };
}