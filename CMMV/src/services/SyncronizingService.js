// import UsersService from '../services/UsersService'
 import Utente from 'src/store/models/utente/Utente'
import db from 'src/store/localbase'
import CommunityMobilizer from 'src/store/models/mobilizer/CommunityMobilizer'
import Appointment from 'src/store/models/appointment/Appointment'
import { UserLogin } from 'src/store/models/userLogin/UserLoginHierarchy'
import { Notify } from 'quasar'
export default {
        sendUtentes () {
          this.doSend(0)
        },
        doSend (i) {
           // const utentesToSend = []
           // const utentesToSend = this.getUtentesToSend()
           db.newDb().collection('utentes').get({ keys: true }).then(utentes => {
            const utentesToSend = []
            utentes.forEach(utente => {
                if (utente.data.syncStatus === 'P') {
                    utentesToSend.push(utente.data)
                } else if (utente.data.syncStatus === 'U') {
                    utente.data.idServer = utente.key.toString()
                    utentesToSend.push(utente.data)
                }
            })
            return utentesToSend
        }).then(utentesToSend => {
            console.log(utentesToSend)
            if (utentesToSend[i] !== undefined) {
                console.log(utentesToSend[i])
                const idToDelete = utentesToSend[i].id.toString()
                const utenteToSend = Object.assign({}, utentesToSend[i])
                utenteToSend.id = null
                utenteToSend.syncStatus = 'S'
                if (utentesToSend[i].syncStatus === 'P') {
                 Utente.apiSave(utenteToSend).then(resp => {
                    utentesToSend[i].syncStatus = 'S'
                    const idServer = resp.response.data.id.toString()
                    db.newDb().collection('utentes').doc({ id: idToDelete }).delete()
                    db.newDb().collection('utentes').doc(idServer).set(utentesToSend[i])
                    Utente.delete(resp.response.data.id)
                 //   db.newDb().collection('utentes').doc({ id: utente.id }).set(utente)
                   i = i + 1
                   setTimeout(this.doSend(i), 2)
                }).catch(error => {
                    console.log(error)
                })
            } else if (utentesToSend[i].syncStatus === 'U') {
                db.newDb().collection('utentes').doc(utentesToSend[i].idServer).get().then(utente => {
                    utenteToSend.id = utentesToSend[i].idServer
                    Utente.apiUpdate(utenteToSend).then(resp => {
                        utentesToSend[i].syncStatus = 'S'
                        const idServer = resp.response.data.id.toString()
                      //  db.newDb().collection('utentes').doc({ id: idToDelete }).delete()
                        db.newDb().collection('utentes').doc(idServer).set(utentesToSend[i])
                        Utente.delete(resp.response.data.id)
                     //   db.newDb().collection('utentes').doc({ id: utente.id }).set(utente)
                       i = i + 1
                       setTimeout(this.doSend(i), 2)
                    })
                  })
            }
            } else {
                Notify.create({
                    icon: 'announcement',
                    message: 'Sincronização de dados Terminada',
                    type: 'positive',
                    progress: true,
                    timeout: 3000,
                    position: 'top',
                    color: 'positive',
                    textColor: 'white',
                    classes: 'glossy'
                  })
            }
        })
        },
        getUtentesToSend () {
           const utentesToSend = []
            db.newDb().collection('utentes').get().then(utentes => {
                utentes.forEach(utente => {
                  //  let utente = utentes[i]
               if (utente.syncStatus === 'P') {
                utentesToSend.push(utente)
               }
               return utentesToSend
                })
            })
        },
       async sendMobilizerData () {
        await db.newDb().collection('mobilizer').get().then(mobilizers => {
            mobilizers.forEach(mobilizer => {
                CommunityMobilizer.api().patch('/communityMobilizer/' + mobilizer.id, mobilizer).then(resp => {
                        console.log(resp.response)
                        CommunityMobilizer.update(mobilizer)
}).catch(error => {
    console.log(error)
})
                     })
                 })
         },
         sendUserDataPassUpdated () {
            db.newDb().collection('users').get().then(mobilizers => {
                const user = mobilizers[0]
                UserLogin.api().patch('/secUser/' + user.idUser, user).then(resp => {
                    console.log(resp.response)
}).catch(error => {
console.log(error)
})
            })
         },
         sendAppointmentsClinicData () {
            db.newDb().collection('appointments').get().then(appointments => {
                const appointmentsToSend = []
                appointments.forEach(appointment => {
                if ((appointment.status === 'CONFIRMADO' && appointment.syncStatus !== 'S') ||
                (appointment.hasHappened && appointment.syncStatus !== 'S')) {
                    appointmentsToSend.push(appointment)
                }
            })
            return appointmentsToSend
            }).then(appointmentsToSend => {
              const i = 0
                console.log(appointmentsToSend)
                      // const appointment[i] =
                      this.sendAppointment(appointmentsToSend, i)
                })
        },
        sendAppointment (appointmentsToSend, i) {
            if (appointmentsToSend[i] !== undefined) {
            Appointment.api().patch('/appointment/' + appointmentsToSend[i].id, appointmentsToSend[i]).then(resp => {
                console.log(resp.response.data)
                appointmentsToSend[i].syncStatus = 'S'
                db.newDb().collection('appointments').doc({ id: appointmentsToSend[i].id }).set(appointmentsToSend[i])
                i = i + 1
                setTimeout(this.sendAppointment(appointmentsToSend, i), 2)
            }).catch(error => {
                console.log(error)
        })
        } else {
            Notify.create({
                icon: 'announcement',
                message: 'Sincronização de dados Terminada',
                type: 'positive',
                progress: true,
                timeout: 3000,
                position: 'top',
                color: 'positive',
                textColor: 'white',
                classes: 'glossy'
              })
        }
    }
   }