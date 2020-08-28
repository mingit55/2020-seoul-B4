class IDB {
    constructor(dbname, storeNames, callback = () => {}){
        let req = indexedDB.open(dbname, 1);
        req.onupgradeneeded = () => {
            let conn = req.result;
            storeNames.forEach(storeName => {
                conn.createObjectStore(storeName, {keyPath: "id", autoIncrement: true});
            });
        };
        req.onsuccess = () => {
            this.conn = req.result;
            callback(this);
        }
    }

    getObjectStore(storeName){
        return this.conn.transaction(storeName, "readwrite").objectStore(storeName);
    }

    get(storeName, id){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.get(id);
            req.onsuccess = () => {
                res(req.result);
            };
        });
    }

    getAll(storeName){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.getAll();
            req.onsuccess = () => {
                res(req.result);
            };
        });
    }

    add(storeName, data){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.add(data);
            req.onsuccess = () => {
                res(req.result);
            };
        });
    }

    put(storeName, data){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.put(data);
            req.onsuccess = () => {
                res(req.result);
            };
        });
    }

    delete(storeName, id){
        return new Promise(res => {
            let os = this.getObjectStore(storeName);
            let req = os.delete(id);
            req.onsuccess = () => {
                res(req.result);
            };
        });
    }
}

class HashModule {
    constructor(rootSelector, examples = []){
        this.$root = $(rootSelector);
        this.hasExamples = examples;// 가지고 있는 예시
        this.viewExamples = [];     // 보여줄 예시
        this.tags = [];             // 가지고 있는 태그들
        this.focusIdx = null;

        this.init();
        this.setEvents();
    }

    init(){
        this.$root.html(`<input id="hash_tags" name="${this.$root.data('name')}" type="hidden">
                        <div class="tag">
                            <div class="tag__input">
                                <input type="text">
                                <div class="example">
                                </div>
                            </div>
                        </div>
                        <div class="tag-error"></div>`);
        this.$value = this.$root.find("#hash_tags");
        this.$container = this.$root.find(".tag");
        this.$input = this.$root.find(".tag__input input");
        this.$exmaples = this.$root.find(".example");
        this.$error = this.$root.find(".tag-error");
    }

    render(){
        this.$container.find(".tag__item").remove();
        
        this.tags.forEach(tag => {
            this.$container.append(`<div class="tag__item">#${tag}<span class="remove">&times;</span></item>`);
        });

        this.$exmaples.html(
            this.viewExamples.map((ex, i) => `<div class="example__item ${i == this.focusIdx ? 'active' : ''}" data-idx="${i}">#${ex}</div>`)
                .join('')
        );
        this.$value.val(JSON.stringify(this.tags));
    }

    pushTag(tagName){
        if(!tagName || tagName.length < 2 || tagName.length > 30){
            return;
        }

        if(this.tags.length >= 10){
            this.$error.text("태그는 10개까지만 추가할 수 있습니다.");
            return;
        }
        if(this.tags.includes(tagName)){
            this.$error.text("이미 추가한 태그입니다.");
            return;
        }

        this.$input.val('');
        this.tags.push(tagName);
    }

    setEvents(){
        // 입력 제한
        this.$input.on("input", e => {
            this.$error.text('');
            this.viewExamples = [];

            e.target.value = e.target.value
                .replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]+/g, "")
                .substr(0, 20);

            if(e.target.value != ""){
                let keyword = e.target.value
                    .replace(/[\.*+?^$\[\]\(\)\\\\\\/]+/, "");
                let regex = new RegExp("^" + keyword);
                
                this.hasExamples.forEach(ex => {
                    if(regex.test(ex) && !this.viewExamples.includes(ex))
                        this.viewExamples.push(ex);
                });
                this.render();
            }

        });

        // 데이터 입력
        this.$input.on("keydown", e => {
            let listLen = this.viewExamples.length;
            // enter && focus
            if(e.keyCode === 13 && this.focusIdx !== null){
                e.preventDefault();
                this.pushTag(this.viewExamples[this.focusIdx]);
                this.viewExamples = [];
                this.focusIdx = null;
            }
            // [enter, tab, spacebar]
            else if([13, 9, 32].includes(e.keyCode)){
                e.preventDefault();
                this.pushTag(this.$input.val());
            }
            // ↑
            else if(e.keyCode == 38){
                e.preventDefault();
                this.focusIdx = this.focusIdx === null ? listLen - 1 
                    : this.focusIdx - 1 < 0 ? listLen - 1 
                    : this.focusIdx - 1;
            }
            // ↓
            else if(e.keyCode == 40){
                e.preventDefault();
                this.focusIdx = this.focusIdx === null ? 0 
                    : this.focusIdx + 1 >= listLen ? 0 
                    : this.focusIdx + 1;
            }
            this.render();
        });

        // 데이터 삭제
        this.$root.on("click", ".remove", e => {
            let text = $(e.currentTarget).parent().text();
            text = text.substr(1, text.length - 2);
            this.tags = this.tags.filter(tag => tag !== text);
            this.render();
        });


        // 마우스 포커스
        this.$exmaples.on("click", ".example__item", e => {
            this.focusIdx = parseInt(e.currentTarget.dataset.idx);
            this.render();
            this.$input.focus();
        })
    }
}


