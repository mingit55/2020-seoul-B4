class Paper {
    constructor({id, image, paper_name, company_name, width_size, height_size, point, hash_tags}){
        this.id = id;
        this.image = image;
        this.paper_name = paper_name;
        this.company_name = company_name;
        this.width_size = width_size;
        this.height_size = height_size;
        this.point = point;
        this.hash_tags = hash_tags;
        this.buyCount = 0;
    }

    get totalPoint(){
        return this.buyCount * this.point;
    }

    updateStore(){
        if(!this.$storeItem){
            this.$storeItem = $(`<div class="col-lg-3 mb-4">
                                    <div class="bg-white border">
                                        <img src="${this.image}" alt="한지 이미지" class="hx-200 fit-cover">
                                        <div class="p-3">
                                            <div class="fx-2">${this.paper_name}</div>
                                            <div class="mt-3">
                                                <span class="fx-n2 text-muted">업체명</span>
                                                <span class="fx-n1 ml-2">${this.company_name}</span>
                                            </div>
                                            <div class="mt-2">
                                                <span class="fx-n2 text-muted">사이즈</span>
                                                <span class="fx-n1 ml-2">${this.width_size}px × ${this.height_size}px</span>
                                            </div>
                                            <div class="mt-2">
                                                <span class="fx-n2 text-muted">포인트</span>
                                                <span class="fx-n1 ml-2">${this.point}p</span>
                                            </div>
                                            <div class="mt-3 d-flex flex-wrap">
                                                ${this.hash_tags.map(tname => `<div class="fx-n2 text-muted m-1">#${tname}</div>`).join('')}
                                            </div>
                                            <button class="btn-filled btn-buy mt-3" data-id="${this.id}">구매하기</button>
                                        </div>
                                    </div>
                                </div>`);
        } else {
            this.$storeItem.find(".btn-buy").text(this.buyCount > 0 ? `추가하기(${this.buyCount}개)` : '구매하기');
        }
    }
    
    updateCart(){
        if(!this.$cartItem){
            this.$cartItem = $(`<div class="t-row">
                                    <div class="cell-50">
                                        <div class="d-flex align-items-center p-3">
                                            <img src="${this.image}" alt="한지 이미지" width="100" height="100">
                                            <div class="text-left ml-4">
                                                <div class="fx-2">${this.paper_name} <span class="text-red fx-n3">(${this.point}p)</span></div>
                                                <div class="fx-n2 text-muted mt-2">${this.company_name}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="cell-20">
                                        <input type="number" class="buy-count" value="${this.buyCount}" data-id="${this.id}">
                                    </div>
                                    <div class="cell-20"><span class="total">${this.totalPoint}</span> <span class="fx-n2 text-muted">p</span></div>
                                    <div class="cell-10">
                                        <button class="btn-filled btn-remove" data-id="${this.id}">삭제</button>
                                    </div>
                                </div>`);
        } else {
            this.$cartItem.find(".buy-count").val(this.buyCount);
            this.$cartItem.find(".total").text(this.totalPoint);
        }
    }
}

class App {
    constructor(){
        this.$store = $("#store-content");
        this.$cart = $("#cart-content");

        
        new IDB("seoul", ["papers", "inventory"], async idb => {
            this.db = idb;
            this.papers = await this.getPapers();
            this.cartList = [];
            this.searchTags = [];
            
            this.updateStore();
            this.updateCart();
            this.setEvents();

            this.tags = this.papers.reduce((p, c) => {
                p.push(...c.hash_tags);
                return p;
            }, []);
            this.entry_module = new HashModule("#entry-tags", this.tags);
            this.search_module = new HashModule("#search", this.tags)
        });
    }

    get totalPoint(){
        return this.papers.reduce((p, c) => p + c.totalPoint, 0);
    }

    get totalCount(){
        return this.papers.reduce((p, c) => p + c.buyCount, 0);   
    }

    updateStore(){
        let viewList = this.papers;

        if(this.searchTags.length > 0){
            viewList = viewList.filter(viewItem => this.searchTags.every(tag => viewItem.hash_tags.includes(tag)));
        }
        
        this.$store.html('');
        viewList.forEach(viewItem => {
            viewItem.updateStore();
            this.$store.append(viewItem.$storeItem);
        });
        if(viewList.length == 0) this.$store.html(`<div class="py-4 text-center">검색된 상품이 없습니다.</div>`);
    }

    updateCart(){
        let viewList = this.cartList;
        
        this.$cart.html('');
        viewList.forEach(viewItem => {
            viewItem.updateCart();
            this.$cart.append(viewItem.$cartItem);
        });
        if(viewList.length == 0) this.$cart.html(`<div class="py-4 text-center">장바구니에 담긴 상품이 없습니다.</div>`);

        $("#total-point").text(this.totalPoint);
    }

    async getPapers(){
        let papers = await this.db.getAll("papers");

        if(papers.length > 0) {
            return papers.map(paper => new Paper(paper));
        }
        else {
            let req = await fetch("/json/papers.json");
            let jsonList = await req.json();
            let papers = []
            jsonList.forEach(jsonItem => {
                let paper = {
                    ...jsonItem,
                    id : parseInt(jsonItem.id),
                    width_size: parseInt(jsonItem.width_size),
                    height_size: parseInt(jsonItem.height_size),
                    point: parseInt(jsonItem.point.replace(/[^0-9]/g, '')),
                    image: "/images/papers/" + jsonItem.image,
                    hash_tags: [],
                };
                papers.push( new Paper(paper) );
                this.db.add("papers", paper);
            });
            return papers;
        }
    }

    setEvents(){
        // image validate
        $("#file-image").on("change", e => {
            if(e.target.files.length === 0) return;
            let file = e.target.files[0];
            
            if(!["jpg", "png", "gif"].includes(file.name.substr(-3).toLowerCase())){
                alert("jpg, png, gif 파일만 업로드 가능합니다.");
                e.target.value = "";
                return;
            }
            if(file.size > 1024 * 1024 * 5){
                alert("5MB 이상의 파일은 업로드할 수 없습니다.");
                e.target.value = "";
                return;
            }

            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                $("#file-base-64").val(reader.result);
            };
        });
        // 한지 등록
        $("#entry-modal").on("submit", e => {
            e.preventDefault();
            
            let data = Array.from($("#entry-modal input[name]"))
                .reduce((obj, input) => {
                    obj[input.name] = input.value;
                    return obj;
                }, {});
            data.hash_tags = JSON.parse(data.hash_tags);
            data.width_size = parseInt(data.width_size);
            data.height_size = parseInt(data.height_size);
            data.point = parseInt(data.point);
            this.db.add("papers", data).then(id => {
                data.id = id;
                this.papers.push( new Paper(data) );
                this.updateStore();
                $("#entry-modal").modal("hide");
            });
        });
        // 한지 구매
        this.$store.on("click", ".btn-buy", e => {
            let paper = this.papers.find(item => item.id == e.currentTarget.dataset.id);
            paper.buyCount++;

            if(!this.cartList.includes(paper)) 
                this.cartList.push(paper);
                
            this.updateStore();
            this.updateCart();
        });
        // 한지 삭제
        this.$cart.on("click", ".btn-remove", e => {
            let paper = this.papers.find(item => item.id == e.currentTarget.dataset.id);
            paper.buyCount = 0;
            this.cartList = this.cartList.filter(item => item !== paper);
            this.updateCart();
            this.updateStore();
        });
        // 수량 조절
        this.$cart.on("input", ".buy-count", e => {
            let value = parseInt(e.target.value);
            if(isNaN(value) || !value || value < 1) value = 1;
            if(value > 1000) value = 1000;
            e.target.value = value;

            let paper = this.papers.find(item => item.id == e.currentTarget.dataset.id);
            paper.buyCount = value;

            this.updateCart();
            this.updateStore();

            e.target.focus();
        });
        // 구매하기
        $("#btn-accept").on("click", async e => {
            alert(`총 ${this.totalCount}개의 한지가 구매되었습니다.`);
            await Promise.all(this.cartList.map(async cartItem => {
                let exist = await this.db.get("inventory", cartItem.id);
                if(exist){
                    exist.count += cartItem.buyCount;
                    this.db.put("inventory", exist);
                } else {
                    this.db.add("inventory", {
                        id: cartItem.id,
                        paper_name: cartItem.paper_name,
                        width_size: cartItem.width_size,
                        height_size: cartItem.height_size,
                        image: cartItem.image,
                        count: cartItem.buyCount
                    });
                }
                cartItem.buyCount = 0;
                console.log(cartItem);
            }));
            this.cartList = [];
            this.updateStore();
            this.updateCart();
        });

        // 검색
        $("#btn-search").on("click", e => {
            this.searchTags = this.search_module.tags;
            this.updateStore();
        });
    }
}

$(function(){
    let app = new App();
});