var express = require("express");
var server = express();
//var bodyParser = require("body-parser");

function searchClient(model, name, date) {
    if (model[name]) {
        return model[name].find(function (curr) {
            if (curr.date === date) return curr;
        })
    } else {
        return false;
    }
}

function clientStatus(client, status) {
    if (client) {
        client.status = status
    }
    return client;
}

var model = {
    clients: {},
    reset: function () { this.clients = {} },

    addAppointment: function (key, value) {
        value['status'] = 'pending';
        if (this.clients[key]) this.clients[key].push(value);
        else this.clients[key] = [value];
        return value;
    },
    attend: function (name, date) {
        return clientStatus(searchClient(this.clients, name, date), 'attended');
    },
    expire: function (name, date) {
        return clientStatus(searchClient(this.clients, name, date), 'expired');
    },
    cancel: function (name, date) {
        return clientStatus(searchClient(this.clients, name, date), 'cancelled');
    },
    erase: function (name, value) {
        let deleted = [];
        this.clients[name] = this.clients[name].filter(function (curr) {
            if (curr.date !== value && curr.status !== value) return curr;
            else deleted.push(curr);
        });
        return deleted;
    },
    getAppointments: function (name, status) {
        if (!status) return this.clients[name];
        return this.clients[name].filter(function (curr) { if (curr.status === status) return curr })
    },
    getClients: function () {
        return Object.keys(this.clients);
    }
};

server.use(express.json());

server.get('/api', function (req, res) {
    res.send(model.clients);
})

server.post('/api/Appointments', function (req, res) {
    const { client, appointment } = req.body;
    if (!client) {
        return res.status(400).send('the body must have a client property')
    } else {
        if (typeof client !== 'string') return res.status(400).send('client must be a string')
        return res.status(200).send(model.addAppointment(client, appointment))
    }
})

server.get('/api/Appointments/clients', function (req, res) {
    return res.send(model.getClients());
})

server.get('/api/Appointments/:name', function (req, res) {
    const { date, option } = req.query;
    const { name } = req.params;
    if (!model.clients[name]) {
        return res.status(400).send('the client does not exist')
    } else {
        if (option === 'attend' || option === 'expire' || option === 'cancel') {
            if (!searchClient(model.clients, name, date)) return res.status(400).send('the client does not have a appointment for that date')
            return res.status(200).send(model[option](name, date));

        } else {
            return res.status(400).send('the option must be attend, expire or cancel')
        }
    }
})

server.get('/api/Appointments/:name/erase', function (req, res) {
    const { date } = req.query;
    const { name } = req.params;
    if (!model.clients[name]) {
        return res.status(400).send('the client does not exist')
    } else {
        return res.status(200).send(model.erase(name, date));
    }
})

server.get('/api/Appointments/getAppointments/:name', function (req, res) {
    const { status } = req.query;
    const { name } = req.params;
    return res.status(200).send(model.getAppointments(name, status));
})

server.listen(3000);
module.exports = { model, server };
