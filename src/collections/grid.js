import _ from 'underscore-bd';
import bbxf from '../define';

export default bbxf.collection.extend({
    sendEmptyFilter: {},
    sort: [],
    initialize() {
        this.pagination = _.clone2(this.paginationDefaults);
    },
    sync(method, model, options) {
        if (this.filterOnServer >= 1) {
            method = 'create';
            options.attrs = {
                filters: this.prepareFilterValues(this.filter.toJSON()),
                sort: {},
                limit: this.limitOnServer || 0,
            };
            options.url = this.url();
        }

        _.bind(bbxf.collection.prototype.sync, this)(method, model, options);
    },
    isAvailable(col) {
        return !('available' in col) || col.available;
    },
    availableCols() {
        return _.filter(this.filter.cols, (col) => {
            return this.isAvailable(col);
        });
    },
    prepareFilterValues(d) {
        var j = {};
        if (_.size(d) > 0) {
            for (var x in d) {
                var c = _.find(this.availableCols(), (o) => o.name === x),
                    v;

                if (!c) continue;
                v = this.filterValue(c, d[x]);
                if (v != '') {
                    j[x] = v;
                } else if (this.filter.sendEmptyFilter[x] !== false) {
                    j[x] = '';
                }
            }
        }

        return j;
    },
    filterResults(r) {
        var cols = this.availableCols();
        if (this.filterOnServer === 1) return r;

        if (cols && cols.length > 0) {
            for (let col of cols) {
                let filterValue = this.filterValue(col),
                    filterValues;
                if (filterValue) {
                    r = _.filter(r, (item) => {
                        var test = false,
                            val =
                                ('val' in col
                                    ? col.val(item)
                                    : item.get(col.name)) + '';

                        if (val) {
                            switch (col.filter || 'exact') {
                                case '%':
                                    test =
                                        val
                                            .toLowerCase()
                                            .indexOf(
                                                filterValue.toLowerCase()
                                            ) === 0;
                                    break;
                                default:
                                    filterValues = (filterValue + '').split(
                                        col.splitter || ','
                                    );
                                    test =
                                        _.size(
                                            _.filter(
                                                filterValues,
                                                (filterValue) =>
                                                    val.trim() ===
                                                    filterValue.trim()
                                            )
                                        ) > 0;
                                    break;
                            }
                        }

                        return test;
                    });
                }
            }
        }

        return r;
    },
    filterValue(o, v) {
        if (!o) return '';
        var format = o.filterVal || ((f) => f);
        typeof v === 'undefined' && (v = this.filter.get(o.name) || '');
        typeof v === 'string' && (v = v.trim());
        return format(v);
    },
    setSort(o) {
        if (typeof this.sort === 'undefined') this.sort = false;
        if (o) this.sort = o;
        if (typeof this.sort === 'string')
            this.sort = this.changeSort(this.sort);
        if (this.sort === true) this.sort = ['', 'asc'];
        return this.sort;
    },
    changeSort(colName) {
        if (this.sort[0] !== colName) {
            this.sort[1] = '';
        }
        this.sort[0] = colName;
        this.sort[1] = this.sort[1] == 'asc' ? 'desc' : 'asc';
    },
    sortType: {
        '#int': (col, options, model) =>
            parseInt(
                col.orderVal
                    ? col.orderVal(model)
                    : col.val
                        ? col.val(model)
                        : model.get(col.name),
                10
            ),
        '#date': (col, options, model) =>
            parseInt(
                bbxf
                    .format(
                        col.orderVal
                            ? col.orderVal(model)
                            : col.val
                                ? col.val(model)
                                : model.get(col.name),
                        'date',
                        1
                    )
                    .replace(/[^0-9]/g, ''),
                10
            ),
        '#list': (col, options, model) =>
            col.orderVal
                ? col.orderVal(model)
                : col.val
                    ? col.val(model)
                    : model.get(col.name),
        '#orderval': (col, options, model) =>
            col.orderVal
                ? col.orderVal(model)
                : col.val
                    ? col.val(model)
                    : model.get(col.name),
    },
    sortResults(r) {
        if (this.sort[0]) {
            var cols = this.getCols(r),
                colInfo =
                    _.findWhere(cols, {
                        name: this.sort[0],
                    }) || {},
                i =
                    typeof colInfo.order !== 'undefined'
                        ? colInfo.order
                        : '#orderval';

            typeof i === 'string' && i in this.sortType && (i = { type: i });
            typeof i === 'object' &&
                (i = _.partial(this.sortType[i.type], colInfo, i));

            r = _.sortBy(r, i);
            if (this.sort[1] === 'desc') r = r.reverse();
        }
        return r;
    },
    paginationDefaults: {
        page: 1,
        pagesData: {
            first: false,
            prev: false,
            next: false,
            last: false,
            list: [],
        },
    },
    pages(results, page) {
        var range = this.getRange(page),
            data = {
                first: false,
                prev: false,
                next: false,
                last: false,
                list: [],
            },
            pageCount = 1;

        if (range.start > 0) {
            data.first = true;
            data.prev = true;
        }

        if (range.stop < results.length) {
            data.next = true;
            data.last = true;
        }

        do {
            data.list.push(pageCount++);
        } while (this.getRange(pageCount).start < results.length);

        return data;
    },
    getRange(page) {
        !this.pagination.limit && (this.pagination.limit = 10);
        var data = {};
        data.limit = this.pagination.limit;
        data.start = page * data.limit - data.limit;
        data.stop = page * data.limit;
        data.list = _.range(data.start, data.stop);
        return data;
    },
    paginate(r) {
        if (!this.pagination.activated) return r;
        var page = this.pagination.page;
        this.pagination.pagesData = this.pages(r, page);

        var paginated = [],
            range = this.getRange(page);

        for (var x of range.list) {
            if (!(x in r)) break;
            paginated.push(r[x]);
        }

        return paginated;
    },
    sortedFilteredResults() {
        var filtered = this.filterResults(this.models),
            sorted = this.sortResults(filtered);

        return sorted;
    },
    listResults() {
        return this.paginate(this.sortedFilteredResults());
    },
    exportResults() {
        return this.sortedFilteredResults();
    },
});
