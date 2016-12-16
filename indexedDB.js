// indexedDB 数据库的操作
export default class IndexedDB{
    constructor(dbName, storeName, version, changeFn){
        this.storeName = storeName;
        this.changeFn = changeFn;
        const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
        const request = indexedDB.open(dbName, version);

        request.onsuccess = e => {
            this.db = e.target.result;
            console.log('Init indexedDB successfully');
        };
        request.onupgradeneeded = e => {
            this.db = e.target.result;
            if(!this.db.objectStoreNames.contains(storeName)){
                this.store = this.db.createObjectStore(storeName);
            }
            console.log('DB version changed, db version: ', this.db.version);
        };
        request.onerror = e => console.info('Can not open indexedDB', e);
    }
    triggerDataChange (){
        if(this.changeFn){
            this.getAll().then(data => this.changeFn(data));
        }
    }
    get(key){
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName);
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(key);
            request.onerror = e => console.info('Can not get value', e);
            request.onsuccess = e => resolve(e.target.result);
        });
    }
    set(value, key, replace){
        this.get(key).then(resp => {
            if(resp){
                // already exist!!
                if(replace){
                    console.info('key exist, change to use function update');
                    this.update(value, key)
                }else{
                    console.info('You should use function update');
                }
            }else{
                const transaction = this.db.transaction(this.storeName, 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.add(value, key);
                request.onerror = e => console.info('Can not add value', e);
                request.onsuccess = e => this.triggerDataChange();
            }
        });
    }
    update(newValue, key, create){
        this.get(key).then(resp => {
            if(resp){
                const transaction = this.db.transaction(this.storeName, 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const request = objectStore.put(newValue, key);
                request.onerror = e => console.info('Can not update value', e);
                request.onsuccess = e => this.triggerDataChange();
            }else{
                if(create){
                    console.info('key no exist, change to use function set');
                    this.set(newValue, key);
                }else{
                    console.info('You should use function set');
                }
            }
        });
    }
    remove(key){
        const request = this.db.transaction(this.storeName, 'readwrite')
            .objectStore(this.storeName)
            .delete(key);
        request.onerror = e => console.info('Can not remove value', e);
        request.onsuccess = e => this.triggerDataChange();
    }
    getAll(){
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            let rowData = [];
            objectStore.openCursor().onsuccess = function (event) {
                let cursor = event.target.result;
                if (!cursor) {
                    resolve(rowData);
                    return;
                }
                rowData.push(cursor.value);
                cursor.continue();
            };
        });
    }
    close(){
        this.db.close();
    }
}