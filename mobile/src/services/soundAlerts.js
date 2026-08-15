import { Vibration } from 'react-native'

export async function playRoleAlertSound() {
  try {
    Vibration.vibrate([0, 350, 180, 350, 180, 600])
  } catch (error) {
    // L'alerte est un confort; une erreur vibration ne doit pas bloquer l'app.
  }
}
