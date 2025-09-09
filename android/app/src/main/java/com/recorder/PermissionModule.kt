package com.recorder

import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class PermissionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), PermissionListener {

    private var permissionPromise: Promise? = null

    override fun getName(): String {
        return "PermissionModule"
    }

    @ReactMethod
    fun requestStoragePermission(promise: Promise) {
        val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity not available")
            return
        }

        val storagePermissions = arrayOf(
            "android.permission.READ_MEDIA_AUDIO",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.READ_MEDIA_VIDEO",
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )
        
        val allGranted = storagePermissions.all { 
            ContextCompat.checkSelfPermission(reactApplicationContext, it) == PackageManager.PERMISSION_GRANTED 
        }

        if (allGranted) {
            promise.resolve("granted")
        } else {
            permissionPromise = promise
            activity.requestPermissions(storagePermissions, 1001, this)
        }
    }

    @ReactMethod
    fun requestPhonePermission(promise: Promise) {
        val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Activity not available")
            return
        }

        val phonePermission = Manifest.permission.READ_PHONE_STATE
        val granted = ContextCompat.checkSelfPermission(reactApplicationContext, phonePermission) == PackageManager.PERMISSION_GRANTED

        if (granted) {
            promise.resolve("granted")
        } else {
            permissionPromise = promise
            activity.requestPermissions(arrayOf(phonePermission), 1002, this)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray): Boolean {
        when (requestCode) {
            1001 -> {
                val allGranted = grantResults.all { it == PackageManager.PERMISSION_GRANTED }
                permissionPromise?.resolve(if (allGranted) "granted" else "denied")
                permissionPromise = null
                return true
            }
            1002 -> {
                val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
                permissionPromise?.resolve(if (granted) "granted" else "denied")
                permissionPromise = null
                return true
            }
        }
        return false
    }
}